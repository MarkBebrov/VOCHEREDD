from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.viewsets import ModelViewSet
from django.core.exceptions import ObjectDoesNotExist
from .models import Queue, QueueUser, User
from .serializers import QueueSerializer, QueueUserSerializer, UserSerializer
from django.db.models import F
from django.db.models import Max
from random import shuffle

class QueueViewSet(ModelViewSet):
    queryset = Queue.objects.all()
    serializer_class = QueueSerializer

    def get_serializer_class(self):
        if self.action == 'users':
            return QueueUserSerializer
        return super().get_serializer_class()

    @action(detail=True, methods=['get', 'post', 'delete'])
    def users(self, request, pk=None):
        queue = self.get_object()
        if request.method == 'GET':
            users = queue.queueuser_set.all()
            serializer = QueueUserSerializer(users, many=True)
            return Response(serializer.data)
        elif request.method == 'POST':
            user_id = request.data.get('user_id')
            is_admin = request.data.get('is_admin', False)
            position = request.data.get('position', None)

            if user_id is None:
                return Response({"error": "Не указан идентификатор пользователя"}, status=status.HTTP_400_BAD_REQUEST)
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                # Если пользователь не существует, создаем нового пользователя
                user = User.objects.create(id=user_id)

            if queue.queueuser_set.filter(user=user).exists():
                return Response({"error": "Пользователь уже находится в очереди"}, status=status.HTTP_400_BAD_REQUEST)

            if position is not None:
                QueueViewSet.shift_users(queue, None, position)  # Перемещаем пользователей в соответствии с новой позицией

            QueueUser.objects.create(queue=queue, user=user, position=position, is_admin=is_admin)

            return Response(status=status.HTTP_200_OK)
        elif request.method == 'DELETE':
            user_id = self.request.query_params.get('user_id', None)

            if user_id is None:
                return Response({"error": "Не указан идентификатор пользователя"}, status=status.HTTP_400_BAD_REQUEST)

            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response({"error": "Пользователь не найден"}, status=status.HTTP_404_NOT_FOUND)

            queue_user = queue.queueuser_set.filter(user=user).first()

            if queue_user is None:
                return Response({"error": "Пользователь не находится в очереди"}, status=status.HTTP_400_BAD_REQUEST)

            QueueViewSet.shift_users(queue, queue_user.position, None)  # Перемещаем пользователей в соответствии с позициями
            queue_user.delete()

            return Response(status=status.HTTP_200_OK)

    @staticmethod
    def shift_users(queue, old_position, new_position):
        # Если старая позиция None, значит мы добавляем нового пользователя в очередь
        if old_position is None:
            QueueUser.objects.filter(queue=queue, position__gte=new_position).update(position=F('position') + 1)
        # Если новая позиция None, значит мы удаляем пользователя из очереди
        elif new_position is None:
            QueueUser.objects.filter(queue=queue, position__gt=old_position).update(position=F('position') - 1)
        else:
            # Мы перемещаем пользователя внутри очереди
            if old_position < new_position:
                # Если пользователь перемещается вниз по очереди, уменьшаем позиции между старой и новой на 1
                QueueUser.objects.filter(queue=queue, position__gt=old_position, position__lte=new_position).update(position=F('position') - 1)
            elif old_position > new_position:
                # Если пользователь перемещается вверх по очереди, увеличиваем позиции между новой и старой на 1
                QueueUser.objects.filter(queue=queue, position__gte=new_position, position__lt=old_position).update(position=F('position') + 1)

    @action(detail=True, methods=['post'])
    def randomize_users(self, request, pk=None):
        queue = self.get_object()
    
        # Получаем всех пользователей очереди в список, у которых position не равно None
        users_with_position = list(queue.queueuser_set.exclude(position=None))
    
        # Рандомизируем список пользователей
        shuffle(users_with_position)
    
        # Проходимся по всем пользователям и обновляем их позиции
        for new_position, user in enumerate(users_with_position, start=1):
            user.position = new_position
            user.save()
    
        return Response(status=status.HTTP_200_OK)

    
    @action(detail=True, methods=['post'])
    def move_user(self, request, pk=None):
        user_id = request.data.get('user_id')
        new_position = request.data.get('new_position')
        if user_id is None:
            return Response({"error": "Не указан идентификатор пользователя"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "Пользователь не найден"}, status=status.HTTP_404_NOT_FOUND)
        
        queue = self.get_object()
        queue_user = QueueUser.objects.filter(queue=queue, user=user).first()
        if queue_user is None:
            return Response({"error": "Пользователь не находится в очереди"}, status=status.HTTP_404_NOT_FOUND)
        
        if queue.limit is not None and queue.queueuser_set.exclude(position=None).count() >= queue.limit:
            return Response({"message": "Очередь переполнена"}, status=status.HTTP_200_OK)
        
        if new_position == "end":
            max_position = queue.queueuser_set.aggregate(Max('position')).get('position__max')
            new_position = max_position + 1 if max_position is not None else 1

        QueueViewSet.shift_users(queue, queue_user.position, new_position)  # Перемещаем пользователей в соответствии с новой позицией

        # Обновляем позицию пользователя
        queue_user.position = new_position
        queue_user.save()

        return Response(status=status.HTTP_200_OK) 

class UserViewSet(ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_object(self):
        queryset = self.get_queryset()
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        filter_kwargs = {self.lookup_field: self.kwargs[lookup_url_kwarg]}
        try:
            obj = queryset.get(**filter_kwargs)
        except User.DoesNotExist:
            obj = User.objects.create(id=filter_kwargs['pk'])
        self.check_object_permissions(self.request, obj)
        return obj

    def get_serializer_class(self):
        if self.action =='queues':
            return QueueSerializer
        return super().get_serializer_class()

    @action(detail=True, methods=['get', 'post', 'delete'])
    def queues(self, request, pk=None):
        user = self.get_object()
        if request.method == 'GET':
            queues = user.queues.all()
            serializer = QueueSerializer(queues, many=True)
            return Response(serializer.data)
        elif request.method in ['POST', 'DELETE']:
            queue_id = request.data.get('queue_id')
            if queue_id is None:
                return Response({"error": "Queue ID is required"}, status=status.HTTP_400_BAD_REQUEST)
            try:
                queue = Queue.objects.get(id=queue_id)
            except Queue.DoesNotExist:
                return Response({"error": "Queue does not exist"}, status=status.HTTP_404_NOT_FOUND)
            if request.method == 'POST':
                user.queues.add(queue)
                queue.users.add(user)
            else:
                user.queues.remove(queue)
                queue.users.remove(user)
            return Response(status=status.HTTP_200_OK)
