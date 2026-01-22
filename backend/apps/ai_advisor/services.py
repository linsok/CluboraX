import logging
from django.utils import timezone
from datetime import timedelta
from .models import AIAdvice, AIModel, AIInteraction, AIKnowledgeBase, AITrainingData
import json
import re

logger = logging.getLogger(__name__)


class AIAdvisorService:
    """
    Main AI advisor service for providing intelligent suggestions.
    """
    
    def __init__(self):
        self.knowledge_base = AIKnowledgeBaseService()
        self.text_processor = TextProcessingService()
        self.policy_checker = PolicyComplianceService()
        self.budget_analyzer = BudgetAnalysisService()
    
    def analyze_event_proposal(self, user, title, description, context=None):
        """
        Analyze event proposal and provide suggestions.
        """
        try:
            # Create AI advice record
            advice = AIAdvice.objects.create(
                user=user,
                advice_type='event_proposal',
                title=title,
                content=description,
                context=context or {}
            )
            
            # Update status to processing
            advice.status = 'processing'
            advice.save()
            
            # Process the proposal
            start_time = timezone.now()
            
            # Extract information
            extracted_info = self.text_processor.extract_event_info(title, description)
            
            # Check policy compliance
            compliance_issues = self.policy_checker.check_event_compliance(extracted_info)
            
            # Generate suggestions
            suggestions = self._generate_event_suggestions(extracted_info, compliance_issues)
            
            # Calculate confidence score
            confidence = self._calculate_confidence(suggestions, compliance_issues)
            
            # Update advice with results
            advice.analysis_result = extracted_info
            advice.suggestions = suggestions
            advice.confidence_score = confidence
            advice.processing_time = timezone.now() - start_time
            advice.status = 'completed'
            advice.save()
            
            # Log interaction
            self._log_ai_interaction(user, 'advice_request', {
                'input': {'title': title, 'description': description},
                'output': suggestions,
                'success': True,
                'response_time': advice.processing_time.total_seconds()
            }, advice_id=str(advice.id))
            
            return advice
            
        except Exception as e:
            logger.error(f"Event proposal analysis error: {e}")
            
            # Update advice status to failed
            if 'advice' in locals():
                advice.status = 'failed'
                advice.save()
            
            raise
    
    def analyze_club_proposal(self, user, title, description, context=None):
        """
        Analyze club proposal and provide suggestions.
        """
        try:
            # Create AI advice record
            advice = AIAdvice.objects.create(
                user=user,
                advice_type='club_proposal',
                title=title,
                content=description,
                context=context or {}
            )
            
            # Update status to processing
            advice.status = 'processing'
            advice.save()
            
            # Process the proposal
            start_time = timezone.now()
            
            # Extract information
            extracted_info = self.text_processor.extract_club_info(title, description)
            
            # Check policy compliance
            compliance_issues = self.policy_checker.check_club_compliance(extracted_info)
            
            # Generate suggestions
            suggestions = self._generate_club_suggestions(extracted_info, compliance_issues)
            
            # Calculate confidence score
            confidence = self._calculate_confidence(suggestions, compliance_issues)
            
            # Update advice with results
            advice.analysis_result = extracted_info
            advice.suggestions = suggestions
            advice.confidence_score = confidence
            advice.processing_time = timezone.now() - start_time
            advice.status = 'completed'
            advice.save()
            
            # Log interaction
            self._log_ai_interaction(user, 'advice_request', {
                'input': {'title': title, 'description': description},
                'output': suggestions,
                'success': True,
                'response_time': advice.processing_time.total_seconds()
            }, advice_id=str(advice.id))
            
            return advice
            
        except Exception as e:
            logger.error(f"Club proposal analysis error: {e}")
            
            # Update advice status to failed
            if 'advice' in locals():
                advice.status = 'failed'
                advice.save()
            
            raise
    
    def improve_content(self, user, content, content_type, context=None):
        """
        Improve content quality and provide suggestions.
        """
        try:
            # Create AI advice record
            advice = AIAdvice.objects.create(
                user=user,
                advice_type='content_improvement',
                title=f"Improve {content_type}",
                content=content,
                context=context or {}
            )
            
            # Update status to processing
            advice.status = 'processing'
            advice.save()
            
            # Process content improvement
            start_time = timezone.now()
            
            # Analyze content
            analysis = self.text_processor.analyze_content(content)
            
            # Generate improvement suggestions
            suggestions = self._generate_content_improvements(analysis, content_type)
            
            # Calculate confidence score
            confidence = self._calculate_confidence(suggestions, [])
            
            # Update advice with results
            advice.analysis_result = analysis
            advice.suggestions = suggestions
            advice.confidence_score = confidence
            advice.processing_time = timezone.now() - start_time
            advice.status = 'completed'
            advice.save()
            
            # Log interaction
            self._log_ai_interaction(user, 'content_improvement', {
                'input': {'content': content[:500], 'type': content_type},
                'output': suggestions,
                'success': True,
                'response_time': advice.processing_time.total_seconds()
            }, advice_id=str(advice.id))
            
            return advice
            
        except Exception as e:
            logger.error(f"Content improvement error: {e}")
            
            # Update advice status to failed
            if 'advice' in locals():
                advice.status = 'failed'
                advice.save()
            
            raise
    
    def _generate_event_suggestions(self, extracted_info, compliance_issues):
        """
        Generate suggestions for event proposal.
        """
        suggestions = []
        
        # Title suggestions
        if not extracted_info.get('title_clarity'):
            suggestions.append({
                'type': 'title',
                'priority': 'high',
                'message': 'Consider making the title more descriptive and engaging',
                'suggestion': 'Add specific details about the event type, target audience, or key activities'
            })
        
        # Description suggestions
        if len(extracted_info.get('description', '')) < 100:
            suggestions.append({
                'type': 'description',
                'priority': 'high',
                'message': 'Description is too brief',
                'suggestion': 'Provide more details about the event purpose, activities, and expected outcomes'
            })
        
        # Date and time suggestions
        if not extracted_info.get('has_date_time'):
            suggestions.append({
                'type': 'datetime',
                'priority': 'high',
                'message': 'Date and time information is missing',
                'suggestion': 'Specify the exact date, start time, and end time for the event'
            })
        
        # Venue suggestions
        if not extracted_info.get('has_venue'):
            suggestions.append({
                'type': 'venue',
                'priority': 'medium',
                'message': 'Venue information is missing',
                'suggestion': 'Specify the location, room number, or online platform for the event'
            })
        
        # Budget suggestions
        if extracted_info.get('mentions_budget') and not extracted_info.get('has_budget_details'):
            suggestions.append({
                'type': 'budget',
                'priority': 'medium',
                'message': 'Budget details are incomplete',
                'suggestion': 'Provide a detailed breakdown of expected costs and funding sources'
            })
        
        # Compliance suggestions
        for issue in compliance_issues:
            suggestions.append({
                'type': 'compliance',
                'priority': 'high',
                'message': f'Compliance issue: {issue["message"]}',
                'suggestion': issue['suggestion']
            })
        
        # Add general improvement suggestions
        general_suggestions = self.knowledge_base.get_event_suggestions(extracted_info)
        suggestions.extend(general_suggestions)
        
        return suggestions
    
    def _generate_club_suggestions(self, extracted_info, compliance_issues):
        """
        Generate suggestions for club proposal.
        """
        suggestions = []
        
        # Mission statement suggestions
        if not extracted_info.get('has_mission_statement'):
            suggestions.append({
                'type': 'mission',
                'priority': 'high',
                'message': 'Mission statement is missing or unclear',
                'suggestion': 'Provide a clear, concise mission statement that defines the club\'s purpose and goals'
            })
        
        # Member requirements suggestions
        if not extracted_info.get('has_member_requirements'):
            suggestions.append({
                'type': 'membership',
                'priority': 'medium',
                'message': 'Membership requirements are not specified',
                'suggestion': 'Define clear criteria for membership, including any prerequisites or requirements'
            })
        
        # Leadership structure suggestions
        if not extracted_info.get('has_leadership_structure'):
            suggestions.append({
                'type': 'leadership',
                'priority': 'medium',
                'message': 'Leadership structure is not defined',
                'suggestion': 'Specify the club leadership roles and responsibilities'
            })
        
        # Activity plan suggestions
        if not extracted_info.get('has_activity_plan'):
            suggestions.append({
                'type': 'activities',
                'priority': 'medium',
                'message': 'Activity plan is missing',
                'suggestion': 'Outline the types of activities and events the club plans to organize'
            })
        
        # Compliance suggestions
        for issue in compliance_issues:
            suggestions.append({
                'type': 'compliance',
                'priority': 'high',
                'message': f'Compliance issue: {issue["message"]}',
                'suggestion': issue['suggestion']
            })
        
        # Add general improvement suggestions
        general_suggestions = self.knowledge_base.get_club_suggestions(extracted_info)
        suggestions.extend(general_suggestions)
        
        return suggestions
    
    def _generate_content_improvements(self, analysis, content_type):
        """
        Generate content improvement suggestions.
        """
        suggestions = []
        
        # Grammar and spelling
        if analysis.get('grammar_errors'):
            suggestions.append({
                'type': 'grammar',
                'priority': 'medium',
                'message': f'Found {len(analysis["grammar_errors"])} grammar errors',
                'suggestion': 'Review and correct grammar and spelling mistakes'
            })
        
        # Clarity suggestions
        if analysis.get('clarity_score', 1.0) < 0.7:
            suggestions.append({
                'type': 'clarity',
                'priority': 'medium',
                'message': 'Content clarity could be improved',
                'suggestion': 'Use simpler language and shorter sentences to improve readability'
            })
        
        # Structure suggestions
        if analysis.get('structure_issues'):
            suggestions.append({
                'type': 'structure',
                'priority': 'low',
                'message': 'Content structure could be improved',
                'suggestion': 'Use headings, bullet points, and paragraphs to organize content better'
            })
        
        # Length suggestions
        if analysis.get('word_count', 0) < 50:
            suggestions.append({
                'type': 'length',
                'priority': 'medium',
                'message': 'Content is too brief',
                'suggestion': 'Add more detail and information to make the content more comprehensive'
            })
        
        return suggestions
    
    def _calculate_confidence(self, suggestions, compliance_issues):
        """
        Calculate confidence score for suggestions.
        """
        base_confidence = 0.8
        
        # Reduce confidence for high-priority issues
        high_priority_count = sum(1 for s in suggestions if s.get('priority') == 'high')
        if high_priority_count > 0:
            base_confidence -= (high_priority_count * 0.1)
        
        # Reduce confidence for compliance issues
        if compliance_issues:
            base_confidence -= (len(compliance_issues) * 0.15)
        
        # Ensure confidence is between 0 and 1
        return max(0.0, min(1.0, base_confidence))
    
    def _log_ai_interaction(self, user, interaction_type, data, advice_id=None):
        """
        Log AI interaction for analytics.
        """
        try:
            AIInteraction.objects.create(
                user=user,
                interaction_type=interaction_type,
                input_data=data.get('input', {}),
                response_data=data.get('output', {}),
                response_time=data.get('response_time'),
                success=data.get('success', False),
                error_message=data.get('error_message'),
                target_object_type='AIAdvice',
                target_object_id=advice_id
            )
        except Exception as e:
            logger.error(f"AI interaction logging error: {e}")


class TextProcessingService:
    """
    Text processing service for content analysis.
    """
    
    def extract_event_info(self, title, description):
        """
        Extract key information from event title and description.
        """
        text = f"{title} {description}".lower()
        
        info = {
            'title_clarity': len(title.split()) > 3,
            'description_length': len(description),
            'has_date_time': bool(re.search(r'\d{1,2}[/\-]\d{1,2}[/\-]\d{4}', text)),
            'has_venue': any(word in text for word in ['venue', 'location', 'room', 'hall', 'online', 'zoom']),
            'mentions_budget': any(word in text for word in ['budget', 'cost', 'fee', 'payment', 'free']),
            'has_budget_details': bool(re.search(r'\$?\d+', text)),
            'event_type': self._detect_event_type(text),
            'target_audience': self._detect_audience(text)
        }
        
        return info
    
    def extract_club_info(self, title, description):
        """
        Extract key information from club title and description.
        """
        text = f"{title} {description}".lower()
        
        info = {
            'title_clarity': len(title.split()) > 2,
            'description_length': len(description),
            'has_mission_statement': any(word in text for word in ['mission', 'purpose', 'goal', 'objective']),
            'has_member_requirements': any(word in text for word in ['member', 'join', 'requirement', 'criteria']),
            'has_leadership_structure': any(word in text for word in ['president', 'leader', 'officer', 'committee']),
            'has_activity_plan': any(word in text for word in ['activity', 'event', 'meeting', 'plan']),
            'club_category': self._detect_club_category(text)
        }
        
        return info
    
    def analyze_content(self, content):
        """
        Analyze content for quality metrics.
        """
        analysis = {
            'word_count': len(content.split()),
            'sentence_count': len(re.split(r'[.!?]+', content)),
            'grammar_errors': self._check_grammar(content),
            'clarity_score': self._calculate_clarity(content),
            'structure_issues': self._check_structure(content)
        }
        
        return analysis
    
    def _detect_event_type(self, text):
        """
        Detect event type from text.
        """
        event_types = {
            'academic': ['workshop', 'seminar', 'lecture', 'conference', 'study'],
            'social': ['party', 'gathering', 'networking', 'social', 'meet'],
            'sports': ['game', 'match', 'tournament', 'sport', 'competition'],
            'cultural': ['culture', 'art', 'music', 'dance', 'performance'],
            'workshop': ['workshop', 'training', 'skill', 'learn']
        }
        
        detected_types = []
        for event_type, keywords in event_types.items():
            if any(keyword in text for keyword in keywords):
                detected_types.append(event_type)
        
        return detected_types[0] if detected_types else 'general'
    
    def _detect_audience(self, text):
        """
        Detect target audience from text.
        """
        audiences = {
            'students': ['student', 'undergraduate', 'graduate'],
            'faculty': ['faculty', 'professor', 'staff', 'teacher'],
            'public': ['public', 'open', 'community'],
            'members': ['member', 'club', 'organization']
        }
        
        detected_audiences = []
        for audience, keywords in audiences.items():
            if any(keyword in text for keyword in keywords):
                detected_audiences.append(audience)
        
        return detected_audiences[0] if detected_audiences else 'general'
    
    def _detect_club_category(self, text):
        """
        Detect club category from text.
        """
        categories = {
            'academic': ['academic', 'study', 'research', 'education'],
            'sports': ['sport', 'athletic', 'fitness', 'game'],
            'cultural': ['culture', 'art', 'music', 'dance', 'performance'],
            'social': ['social', 'community', 'networking'],
            'technical': ['technical', 'technology', 'programming', 'computer'],
            'service': ['service', 'volunteer', 'charity', 'community']
        }
        
        detected_categories = []
        for category, keywords in categories.items():
            if any(keyword in text for keyword in keywords):
                detected_categories.append(category)
        
        return detected_categories[0] if detected_categories else 'general'
    
    def _check_grammar(self, content):
        """
        Basic grammar checking (simplified).
        """
        errors = []
        
        # Check for common errors
        common_errors = [
            (r'\bi\s+(\w+)', 'Double space after "bi"'),
            (r'\s+', 'Multiple spaces'),
            (r'(\w+)\'s', 'Possessive error'),
        ]
        
        for pattern, description in common_errors:
            if re.search(pattern, content):
                errors.append(description)
        
        return errors
    
    def _calculate_clarity(self, content):
        """
        Calculate content clarity score.
        """
        # Simplified clarity calculation
        words = content.split()
        sentences = re.split(r'[.!?]+', content)
        
        if not sentences:
            return 0.0
        
        avg_sentence_length = len(words) / len(sentences)
        
        # Ideal sentence length is 15-20 words
        if 10 <= avg_sentence_length <= 25:
            return 1.0
        elif 5 <= avg_sentence_length <= 35:
            return 0.8
        else:
            return 0.5
    
    def _check_structure(self, content):
        """
        Check content structure.
        """
        issues = []
        
        # Check for very long paragraphs
        paragraphs = content.split('\n\n')
        for i, paragraph in enumerate(paragraphs):
            if len(paragraph) > 500:
                issues.append(f'Paragraph {i+1} is too long')
        
        # Check for missing punctuation
        if not re.search(r'[.!?]$', content.strip()):
            issues.append('Missing ending punctuation')
        
        return issues


class PolicyComplianceService:
    """
    Policy compliance checking service.
    """
    
    def check_event_compliance(self, extracted_info):
        """
        Check event compliance with university policies.
        """
        issues = []
        
        # Check for required information
        if not extracted_info.get('has_date_time'):
            issues.append({
                'type': 'missing_info',
                'message': 'Event date and time is required',
                'suggestion': 'Add specific date and time information'
            })
        
        if not extracted_info.get('has_venue'):
            issues.append({
                'type': 'missing_info',
                'message': 'Event venue is required',
                'suggestion': 'Specify the location or platform for the event'
            })
        
        # Check for scheduling conflicts
        if extracted_info.get('has_date_time'):
            # This would check against existing events
            # For now, we'll just note that it should be checked
            pass
        
        # Check budget compliance
        if extracted_info.get('mentions_budget'):
            if not extracted_info.get('has_budget_details'):
                issues.append({
                    'type': 'budget_compliance',
                    'message': 'Budget details are required for paid events',
                    'suggestion': 'Provide detailed budget breakdown and funding sources'
                })
        
        return issues
    
    def check_club_compliance(self, extracted_info):
        """
        Check club compliance with university policies.
        """
        issues = []
        
        # Check for required information
        if not extracted_info.get('has_mission_statement'):
            issues.append({
                'type': 'missing_info',
                'message': 'Mission statement is required',
                'suggestion': 'Add a clear mission statement defining the club\'s purpose'
            })
        
        if not extracted_info.get('has_member_requirements'):
            issues.append({
                'type': 'missing_info',
                'message': 'Member requirements are required',
                'suggestion': 'Define clear membership criteria and requirements'
            })
        
        # Check for minimum member requirement
        # This would typically be 10 members for new clubs
        pass
        
        return issues


class BudgetAnalysisService:
    """
    Budget analysis service.
    """
    
    def analyze_budget(self, budget_info):
        """
        Analyze budget information and provide suggestions.
        """
        suggestions = []
        
        # Check for completeness
        if not budget_info.get('total_amount'):
            suggestions.append({
                'type': 'budget_completeness',
                'priority': 'high',
                'message': 'Total budget amount is missing',
                'suggestion': 'Specify the total budget amount'
            })
        
        if not budget_info.get('breakdown'):
            suggestions.append({
                'type': 'budget_completeness',
                'priority': 'high',
                'message': 'Budget breakdown is missing',
                'suggestion': 'Provide a detailed breakdown of all expenses'
            })
        
        # Check for reasonableness
        if budget_info.get('total_amount') and budget_info.get('breakdown'):
            total = budget_info['total_amount']
            breakdown_total = sum(item.get('amount', 0) for item in budget_info['breakdown'])
            
            if abs(total - breakdown_total) > 0.01 * total:  # 1% tolerance
                suggestions.append({
                    'type': 'budget_accuracy',
                    'priority': 'high',
                    'message': 'Budget total doesn\'t match breakdown total',
                    'suggestion': 'Ensure the budget breakdown matches the total amount'
                })
        
        return suggestions


class AIKnowledgeBaseService:
    """
    AI knowledge base service for reference information.
    """
    
    def get_event_suggestions(self, extracted_info):
        """
        Get event-specific suggestions from knowledge base.
        """
        suggestions = []
        
        # Get relevant knowledge base entries
        relevant_entries = AIKnowledgeBase.objects.filter(
            knowledge_type='guideline',
            is_active=True,
            tags__contains=['event']
        )
        
        for entry in relevant_entries:
            if self._is_relevant(entry.content, extracted_info):
                suggestions.append({
                    'type': 'knowledge_base',
                    'priority': 'low',
                    'message': entry.title,
                    'suggestion': entry.content
                })
                
                # Mark as used
                entry.mark_used()
        
        return suggestions
    
    def get_club_suggestions(self, extracted_info):
        """
        Get club-specific suggestions from knowledge base.
        """
        suggestions = []
        
        # Get relevant knowledge base entries
        relevant_entries = AIKnowledgeBase.objects.filter(
            knowledge_type='guideline',
            is_active=True,
            tags__contains=['club']
        )
        
        for entry in relevant_entries:
            if self._is_relevant(entry.content, extracted_info):
                suggestions.append({
                    'type': 'knowledge_base',
                    'priority': 'low',
                    'message': entry.title,
                    'suggestion': entry.content
                })
                
                # Mark as used
                entry.mark_used()
        
        return suggestions
    
    def _is_relevant(self, content, extracted_info):
        """
        Check if knowledge base entry is relevant to extracted info.
        """
        content_lower = content.lower()
        
        # Check for relevance based on extracted info
        for key, value in extracted_info.items():
            if isinstance(value, str) and value.lower() in content_lower:
                return True
            elif isinstance(value, list) and any(v.lower() in content_lower for v in value):
                return True
        
        return False
