from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.core.models import TimeStampedModel
import uuid

User = get_user_model()


class AIAdvice(TimeStampedModel):
    """
    AI advice model for storing AI-generated suggestions.
    """
    ADVICE_TYPES = [
        ('event_proposal', 'Event Proposal'),
        ('club_proposal', 'Club Proposal'),
        ('content_improvement', 'Content Improvement'),
        ('policy_compliance', 'Policy Compliance'),
        ('budget_optimization', 'Budget Optimization'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='ai_advices'
    )
    advice_type = models.CharField(max_length=30, choices=ADVICE_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Input data
    title = models.CharField(max_length=200)
    content = models.TextField()
    context = models.JSONField(default=dict, blank=True)
    
    # AI analysis results
    analysis_result = models.JSONField(default=dict, blank=True)
    suggestions = models.JSONField(default=list, blank=True)
    confidence_score = models.FloatField(null=True, blank=True)
    processing_time = models.DurationField(null=True, blank=True)
    
    # Target object references
    target_object_type = models.CharField(max_length=50, blank=True, null=True)
    target_object_id = models.CharField(max_length=50, blank=True, null=True)
    
    # Feedback
    user_feedback = models.TextField(blank=True, null=True)
    is_helpful = models.BooleanField(null=True, blank=True)
    applied = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'ai_advices'
        verbose_name = 'AI Advice'
        verbose_name_plural = 'AI Advices'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'advice_type']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.full_name} - {self.get_advice_type_display()}"
    
    @property
    def is_completed(self):
        return self.status == 'completed'
    
    @property
    def has_suggestions(self):
        return bool(self.suggestions)
    
    def apply_suggestions(self):
        """
        Mark suggestions as applied.
        """
        self.applied = True
        self.save(update_fields=['applied'])


class AIModel(TimeStampedModel):
    """
    AI model configuration and versioning.
    """
    MODEL_TYPES = [
        ('text_generation', 'Text Generation'),
        ('classification', 'Classification'),
        ('sentiment_analysis', 'Sentiment Analysis'),
        ('content_analysis', 'Content Analysis'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('training', 'Training'),
        ('deprecated', 'Deprecated'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    model_type = models.CharField(max_length=30, choices=MODEL_TYPES)
    version = models.CharField(max_length=20)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='inactive')
    
    # Model configuration
    config = models.JSONField(default=dict, blank=True)
    parameters = models.JSONField(default=dict, blank=True)
    
    # Performance metrics
    accuracy = models.FloatField(null=True, blank=True)
    precision = models.FloatField(null=True, blank=True)
    recall = models.FloatField(null=True, blank=True)
    f1_score = models.FloatField(null=True, blank=True)
    
    # Usage statistics
    total_requests = models.PositiveIntegerField(default=0)
    successful_requests = models.PositiveIntegerField(default=0)
    failed_requests = models.PositiveIntegerField(default=0)
    average_response_time = models.FloatField(null=True, blank=True)
    
    # Model metadata
    description = models.TextField(blank=True, null=True)
    training_data = models.TextField(blank=True, null=True)
    model_path = models.CharField(max_length=500, blank=True, null=True)
    
    class Meta:
        db_table = 'ai_models'
        verbose_name = 'AI Model'
        verbose_name_plural = 'AI Models'
        ordering = ['-created_at']
        unique_together = ['name', 'version']
    
    def __str__(self):
        return f"{self.name} v{self.version}"
    
    @property
    def success_rate(self):
        if self.total_requests == 0:
            return 0.0
        return (self.successful_requests / self.total_requests) * 100
    
    def update_statistics(self, success, response_time):
        """
        Update model usage statistics.
        """
        self.total_requests += 1
        
        if success:
            self.successful_requests += 1
        else:
            self.failed_requests += 1
        
        # Update average response time
        if self.average_response_time is None:
            self.average_response_time = response_time
        else:
            self.average_response_time = (
                (self.average_response_time * (self.total_requests - 1) + response_time) / 
                self.total_requests
            )
        
        self.save(update_fields=[
            'total_requests', 'successful_requests', 'failed_requests', 
            'average_response_time'
        ])


class AIInteraction(TimeStampedModel):
    """
    AI interaction log for tracking and analytics.
    """
    INTERACTION_TYPES = [
        ('advice_request', 'Advice Request'),
        ('content_analysis', 'Content Analysis'),
        ('auto_suggestion', 'Auto Suggestion'),
        ('error_correction', 'Error Correction'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='ai_interactions'
    )
    interaction_type = models.CharField(max_length=30, choices=INTERACTION_TYPES)
    
    # Request details
    input_data = models.JSONField()
    model_used = models.ForeignKey(
        AIModel, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='interactions'
    )
    
    # Response details
    response_data = models.JSONField(null=True, blank=True)
    response_time = models.FloatField(null=True, blank=True)
    success = models.BooleanField(default=False)
    error_message = models.TextField(blank=True, null=True)
    
    # User feedback
    user_rating = models.IntegerField(null=True, blank=True)
    user_comment = models.TextField(blank=True, null=True)
    
    # Session tracking
    session_id = models.CharField(max_length=100, blank=True, null=True)
    
    class Meta:
        db_table = 'ai_interactions'
        verbose_name = 'AI Interaction'
        verbose_name_plural = 'AI Interactions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'interaction_type']),
            models.Index(fields=['created_at']),
            models.Index(fields=['session_id']),
        ]
    
    def __str__(self):
        return f"{self.user.full_name} - {self.get_interaction_type_display()}"


class AIKnowledgeBase(TimeStampedModel):
    """
    AI knowledge base for storing training data and reference information.
    """
    KNOWLEDGE_TYPES = [
        ('policy', 'Policy'),
        ('guideline', 'Guideline'),
        ('example', 'Example'),
        ('template', 'Template'),
        ('faq', 'FAQ'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    knowledge_type = models.CharField(max_length=20, choices=KNOWLEDGE_TYPES)
    content = models.TextField()
    
    # Metadata
    category = models.CharField(max_length=100, blank=True, null=True)
    tags = models.JSONField(default=list, blank=True)
    priority = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    # Usage tracking
    usage_count = models.PositiveIntegerField(default=0)
    last_used = models.DateTimeField(null=True, blank=True)
    
    # Quality metrics
    relevance_score = models.FloatField(null=True, blank=True)
    accuracy_score = models.FloatField(null=True, blank=True)
    
    class Meta:
        db_table = 'ai_knowledge_base'
        verbose_name = 'AI Knowledge Base'
        verbose_name_plural = 'AI Knowledge Base'
        ordering = ['-priority', 'title']
        indexes = [
            models.Index(fields=['knowledge_type', 'category']),
            models.Index(fields=['is_active']),
            models.Index(fields=['tags']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.get_knowledge_type_display()})"
    
    def mark_used(self):
        """
        Mark knowledge base entry as used.
        """
        self.usage_count += 1
        self.last_used = timezone.now()
        self.save(update_fields=['usage_count', 'last_used'])


class AITrainingData(TimeStampedModel):
    """
    AI training data for model improvement.
    """
    DATA_TYPES = [
        ('advice_feedback', 'Advice Feedback'),
        ('user_correction', 'User Correction'),
        ('successful_example', 'Successful Example'),
        ('failure_case', 'Failure Case'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    data_type = models.CharField(max_length=30, choices=DATA_TYPES)
    
    # Training data
    input_text = models.TextField()
    expected_output = models.TextField()
    actual_output = models.TextField(blank=True, null=True)
    
    # Quality metrics
    quality_score = models.FloatField(null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    
    # Metadata
    context = models.JSONField(default=dict, blank=True)
    tags = models.JSONField(default=list, blank=True)
    
    # Usage
    used_for_training = models.BooleanField(default=False)
    training_date = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'ai_training_data'
        verbose_name = 'AI Training Data'
        verbose_name_plural = 'AI Training Data'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['data_type']),
            models.Index(fields=['is_verified']),
            models.Index(fields=['used_for_training']),
        ]
    
    def __str__(self):
        return f"{self.get_data_type_display()} - {self.id}"


class AIConfiguration(TimeStampedModel):
    """
    AI system configuration.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    # Configuration metadata
    category = models.CharField(max_length=50, default='general')
    data_type = models.CharField(max_length=20, default='string')
    
    class Meta:
        db_table = 'ai_configuration'
        verbose_name = 'AI Configuration'
        verbose_name_plural = 'AI Configurations'
        ordering = ['category', 'key']
    
    def __str__(self):
        return f"{self.key} = {self.value}"
    
    @classmethod
    def get_value(cls, key, default=None):
        """
        Get configuration value.
        """
        try:
            config = cls.objects.get(key=key, is_active=True)
            return config.get_typed_value()
        except cls.DoesNotExist:
            return default
    
    def get_typed_value(self):
        """
        Get value converted to appropriate type.
        """
        if self.data_type == 'integer':
            return int(self.value)
        elif self.data_type == 'float':
            return float(self.value)
        elif self.data_type == 'boolean':
            return self.value.lower() in ('true', '1', 'yes', 'on')
        elif self.data_type == 'json':
            import json
            return json.loads(self.value)
        else:
            return self.value
    
    def set_typed_value(self, value):
        """
        Set value from typed value.
        """
        if self.data_type == 'json':
            import json
            self.value = json.dumps(value)
        else:
            self.value = str(value)
