from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.viewsets import ModelViewSet
from django.core.exceptions import ObjectDoesNotExist
from .models import Queue, QueueUser, User
from .serializers import QueueSerializer, QueueUserSerializer, UserSerializer
from django.db.models import F
from django.db.models import Max
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
        elif request.method in ['POST', 'DELETE']:
            user_id = request.data.get('user_id')
            is_admin = request.data.get('is_admin', False)
            position = request.data.get('position', None)
            
            if user_id is None:
                return Response({"error": "Не указан идентификатор пользователя"}, status=status.HTTP_400_BAD_REQUEST)
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response({"error": "Пользователь не найден"}, status=status.HTTP_404_NOT_FOUND)
            
            if queue.queueuser_set.filter(user=user).exists():
                return Response({"error": "Пользователь уже находится в очереди"}, status=status.HTTP_400_BAD_REQUEST)

            if position is not None:
                QueueViewSet.shift_users(queue, position)  # Перемещаем пользователей в соответствии с новой позицией

            QueueUser.objects.create(queue=queue, user=user, position=position, is_admin=is_admin)
                
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
        
        if new_position == "end":
            max_position = queue.queueuser_set.aggregate(Max('position')).get('position__max')
            new_position = max_position + 1 if max_position is not None else 1

        QueueViewSet.shift_users(queue, new_position)  # Перемещаем пользователей в соответствии с новой позицией

        # Обновляем позицию пользователя
        queue_user.position = new_position
        queue_user.save()

        return Response(status=status.HTTP_200_OK)

    @staticmethod
    def shift_users(queue, new_position):
        # Обновляем позиции остальных пользователей
        QueueUser.objects.filter(queue=queue, position__gte=new_position).update(position=F('position')+1)

                


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

