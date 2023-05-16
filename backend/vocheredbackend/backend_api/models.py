from django.db import models

class User(models.Model):
    id = models.IntegerField(primary_key=True)

class Queue(models.Model):
    id = models.AutoField(primary_key=True)
    creator_id = models.PositiveIntegerField(default=1)
    name = models.CharField(max_length=200)
    limit = models.PositiveIntegerField(null=True, blank=True)
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    current_position = models.PositiveIntegerField(default=1)
    users = models.ManyToManyField(User, through='QueueUser', related_name="queues")

class QueueUser(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    queue = models.ForeignKey(Queue, on_delete=models.CASCADE)
    position = models.PositiveIntegerField(default=None, null=True)
    is_admin = models.BooleanField(default=False)
    class Meta:
        ordering = ['position']
