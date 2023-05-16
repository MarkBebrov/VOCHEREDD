from rest_framework import serializers
from .models import Queue, User, QueueUser

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id']

class QueueUserSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = QueueUser
        fields = ['user', 'position', 'is_admin']

class QueueSerializer(serializers.ModelSerializer):
    users = QueueUserSerializer(source='queueuser_set', many=True, read_only=True)

    class Meta:
        model = Queue
        fields = ['id', 'name', 'limit', 'start_date', 'end_date', 'current_position', 'users', "creator_id"]
