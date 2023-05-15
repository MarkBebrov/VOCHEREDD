from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.viewsets import ModelViewSet
from .models import Queue, User
from .serializers import QueueSerializer, UserSerializer

class QueueViewSet(ModelViewSet):
    queryset = Queue.objects.all()
    serializer_class = QueueSerializer

    def get_serializer_class(self):
        if self.action == 'users':
            return UserSerializer
        return super().get_serializer_class()

    # Получить список участников очереди
    @action(detail=True, methods=['get', 'post', 'delete'])
    def users(self, request, pk=None):
        queue = self.get_object()
        if request.method == 'GET':
            users = queue.users.all()
            serializer = UserSerializer(users, many=True)
            return Response(serializer.data)
        elif request.method == 'POST':
            user = User.objects.get(id=request.data['id'])
            queue.users.add(user)
            user.queues.add(queue) # Обновление списка очередей пользователя
            return Response(status=status.HTTP_200_OK)
        elif request.method == 'DELETE':
            user = User.objects.get(id=request.data['id'])
            queue.users.remove(user)
            user.queues.remove(queue) # Обновление списка очередей пользователя
            return Response(status=status.HTTP_200_OK)


class UserViewSet(ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_serializer_class(self):
        if self.action =='queues':
            return QueueSerializer
        return super().get_serializer_class()
    
    def retrieve(self, request, *args, **kwargs):
        user_id = self.kwargs.get('pk')  # Получаем user_id из URL-адреса
        try:
            user = User.objects.get(id=user_id)  # Пытаемся найти пользователя по user_id
        except User.DoesNotExist:
            user = User.objects.create(id=user_id)  # Создаем пользователя, если он не существует
        return super().retrieve(request, *args, **kwargs)

    @action(detail=True, methods=['get', 'post', 'delete'])
    def queues(self, request, pk=None):
        user = self.get_object()
        if request.method == 'GET':
            queues = user.queues.all()
            serializer = QueueSerializer(queues, many=True)
            return Response(serializer.data)
        elif request.method == 'POST':
            queue = Queue.objects.get(id=request.data['queue_id'])
            user.queues.add(queue)
            queue.users.add(user)
            return Response(status=status.HTTP_200_OK)
        elif request.method == 'DELETE':
            queue = Queue.objects.get(id=request.data['queue_id'])
            user.queues.remove(queue)
            queue.users.remove(user)
            return Response(status=status.HTTP_200_OK)