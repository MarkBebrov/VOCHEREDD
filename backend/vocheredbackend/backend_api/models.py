from django.db import models

class User(models.Model):
    id = models.IntegerField(primary_key=True)

class Queue(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=200)
    limit = models.PositiveIntegerField(null=True, blank=True)
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    current_position = models.PositiveIntegerField(default=0)
    users = models.ManyToManyField(User, related_name="queues")
