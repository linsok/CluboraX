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
    
    def validate(self, data):
        """
        Handle field mapping from frontend form to backend model
        """
        # Map eventTitle to title if title is missing
        if 'eventTitle' in data and not data.get('title'):
            data['title'] = data['eventTitle']
        elif not data.get('title') and not data.get('eventTitle'):
            raise serializers.ValidationError({"title": "Event title is required"})
        
        # Ensure we have at least title or eventTitle
        if not data.get('title'):
            data['title'] = data.get('eventTitle', 'Untitled Event')
        
        # Map capacity to expected_participants if needed
        if 'capacity' in data and not data.get('expected_participants'):
            data['expected_participants'] = data['capacity']
        
        # Map budget to total_budget if needed
        if 'budget' in data and not data.get('total_budget'):
            data['total_budget'] = data['budget']
        
        # Handle date validation based on event duration
        event_duration = data.get('eventDurationDays', 1)
        
        if event_duration == 1:
            # Single day event - require eventDate
            if not data.get('eventDate'):
                raise serializers.ValidationError({"eventDate": "Event date is required for single-day events"})
        else:
            # Multi-day event - require startDate and endDate
            if not data.get('startDate'):
                raise serializers.ValidationError({"startDate": "Start date is required for multi-day events"})
            if not data.get('endDate'):
                raise serializers.ValidationError({"endDate": "End date is required for multi-day events"})
            
            # Validate end date is after start date
            if data.get('startDate') and data.get('endDate'):
                if data['endDate'] < data['startDate']:
                    raise serializers.ValidationError({"endDate": "End date must be after start date"})
        
        return data
    
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
