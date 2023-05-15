from rest_framework import serializers
from .models import Queue, User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id']


class QueueSerializer(serializers.ModelSerializer):
    users = UserSerializer(many=True, read_only=True)

    class Meta:
        model = Queue
        fields = ['id', 'name', 'limit', 'start_date', 'end_date', 'current_position', 'users']
