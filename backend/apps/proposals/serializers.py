from rest_framework import serializers
from .models import EventProposal, ClubProposal
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class EventProposalSerializer(serializers.ModelSerializer):
    submitted_by_details = UserSerializer(source='submitted_by', read_only=True)
    reviewed_by_details = UserSerializer(source='reviewed_by', read_only=True)
    
    class Meta:
        model = EventProposal
        fields = '__all__'
        read_only_fields = ('submitted_by', 'submitted_date', 'reviewed_by', 'reviewed_date', 'updated_at')
    
    def create(self, validated_data):
        validated_data['submitted_by'] = self.context['request'].user
        return super().create(validated_data)


class ClubProposalSerializer(serializers.ModelSerializer):
    submitted_by_details = UserSerializer(source='submitted_by', read_only=True)
    reviewed_by_details = UserSerializer(source='reviewed_by', read_only=True)
    
    class Meta:
        model = ClubProposal
        fields = '__all__'
        read_only_fields = ('submitted_by', 'submitted_date', 'reviewed_by', 'reviewed_date', 'updated_at')
    
    def create(self, validated_data):
        validated_data['submitted_by'] = self.context['request'].user
        return super().create(validated_data)
