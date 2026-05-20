from rest_framework import status, generics, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Q, Count, Avg
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    Notification, NotificationTemplate, NotificationPreference,
    NotificationDeliveryLog, BulkNotification
)
from .serializers import (
    NotificationSerializer, NotificationCreateSerializer,
    NotificationTemplateSerializer, NotificationPreferenceSerializer,
    NotificationDeliveryLogSerializer, BulkNotificationSerializer,
    BulkNotificationCreateSerializer, NotificationStatsSerializer,
    NotificationSearchSerializer
)
from apps.core.permissions import IsOwnerOrAdmin
from apps.core.utils import send_notification, log_user_action
import logging

logger = logging.getLogger(__name__)


class NotificationListCreateView(generics.ListCreateAPIView):
    """
    Notification list and create view.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'priority', 'is_read']
    search_fields = ['title', 'message']
    ordering_fields = ['created_at', 'priority', 'type']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """
        Get notifications for current user.
        """
        user = self.request.user
        
        # Base queryset - user's notifications
        queryset = Notification.objects.filter(user=user)
        
        # Filter out expired notifications
        queryset = queryset.exclude(
            expires_at__lt=timezone.now()
        )
        
        # Additional filters
        unread_only = self.request.query_params.get('unread_only')
        if unread_only == 'true':
            queryset = queryset.filter(is_read=False)
        
        return queryset
    
    def get_serializer_class(self):
        """
        Get appropriate serializer based on request method.
        """
        if self.request.method == 'POST':
            return NotificationCreateSerializer
        return NotificationSerializer
    
    def perform_create(self, serializer):
        """
        Create notification.
        """
        # Only admins can create notifications for other users
        user = self.request.user
        if user.role != 'admin':
            serializer.validated_data['user'] = user
        
        notification = serializer.save()
        
        # Log user action
        log_user_action(
            self.request,
            'create',
            'Notification',
            notification.id,
            new_values=serializer.data
        )


class NotificationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Notification detail view.
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    
    def get_queryset(self):
        """
        Get notifications for current user (or all for admin).
        """
        user = self.request.user
        
        if user.role == 'admin':
            return Notification.objects.all()
        else:
            return Notification.objects.filter(user=user)
    
    def perform_update(self, serializer):
        """
        Update notification and log action.
        """
        old_values = Notification.objects.get(pk=self.get_object().pk).__dict__
        serializer.save()
        
        # Log user action
        log_user_action(
            self.request,
            'update',
            'Notification',
            serializer.instance.id,
            old_values=old_values,
            new_values=serializer.data
        )


class NotificationMarkReadView(APIView):
    """
    Mark notification as read view.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, notification_id):
        """
        Mark notification as read.
        """
        try:
            notification = Notification.objects.get(
                id=notification_id,
                user=request.user
            )
            
            notification.mark_as_read()
            
            return Response({
                'success': True,
                'message': 'Notification marked as read',
                'data': {
                    'is_read': notification.is_read,
                    'read_at': notification.read_at
                }
            })
            
        except Notification.DoesNotExist:
            return Response({
                'error': True,
                'message': 'Notification not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Mark notification read error: {e}")
            return Response({
                'error': True,
                'message': 'Failed to mark notification as read'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class NotificationMarkAllReadView(APIView):
    """
    Mark all notifications as read view.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """
        Mark all notifications as read for user.
        """
        try:
            user = request.user
            
            # Get unread notifications
            unread_notifications = Notification.objects.filter(
                user=user,
                is_read=False
            )
            
            # Mark as read
            count = unread_notifications.count()
            unread_notifications.update(
                is_read=True,
                read_at=timezone.now()
            )
            
            return Response({
                'success': True,
                'message': f'Marked {count} notifications as read',
                'data': {
                    'marked_count': count
                }
            })
            
        except Exception as e:
            logger.error(f"Mark all notifications read error: {e}")
            return Response({
                'error': True,
                'message': 'Failed to mark notifications as read'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class NotificationStatsView(APIView):
    """
    Notification statistics view.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """
        Get notification statistics for user.
        """
        try:
            user = request.user
            
            # Base queryset
            if user.role == 'admin':
                notifications = Notification.objects.all()
            else:
                notifications = Notification.objects.filter(user=user)
            
            # Calculate statistics
            stats = {
                'total_notifications': notifications.count(),
                'unread_notifications': notifications.filter(is_read=False).count(),
                'read_notifications': notifications.filter(is_read=True).count(),
            }
            
            # Notifications by type
            notifications_by_type = notifications.values('type').annotate(
                count=Count('id')
            ).order_by('-count')
            stats['notifications_by_type'] = list(notifications_by_type)
            
            # Notifications by priority
            notifications_by_priority = notifications.values('priority').annotate(
                count=Count('id')
            ).order_by('-count')
            stats['notifications_by_priority'] = list(notifications_by_priority)
            
            # Delivery statistics (admin only)
            if user.role == 'admin':
                delivery_stats = NotificationDeliveryLog.objects.values(
                    'delivery_type', 'status'
                ).annotate(
                    count=Count('id')
                ).order_by('delivery_type', 'status')
                stats['delivery_stats'] = list(delivery_stats)
            else:
                stats['delivery_stats'] = []
            
            serializer = NotificationStatsSerializer(stats)
            
            return Response({
                'success': True,
                'data': serializer.data
            })
            
        except Exception as e:
            logger.error(f"Notification stats error: {e}")
            return Response({
                'error': True,
                'message': 'Failed to load statistics'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class NotificationTemplateListCreateView(generics.ListCreateAPIView):
    """
    Notification template list and create view.
    """
    serializer_class = NotificationTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['type', 'is_active']
    search_fields = ['name', 'title_template', 'message_template']
    
    def get_queryset(self):
        """
        Get templates based on user role.
        """
        user = self.request.user
        
        if user.role == 'admin':
            return NotificationTemplate.objects.all()
        else:
            return NotificationTemplate.objects.filter(is_active=True)
    
    def perform_create(self, serializer):
        """
        Create notification template.
        """
        template = serializer.save()
        
        # Log user action
        log_user_action(
            self.request,
            'create',
            'NotificationTemplate',
            template.id,
            new_values=serializer.data
        )


class NotificationTemplateDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Notification template detail view.
    """
    serializer_class = NotificationTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Get templates based on user role.
        """
        user = self.request.user
        
        if user.role == 'admin':
            return NotificationTemplate.objects.all()
        else:
            return NotificationTemplate.objects.filter(is_active=True)


class NotificationPreferenceView(generics.RetrieveUpdateAPIView):
    """
    Notification preference view.
    """
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        """
        Get or create user notification preferences.
        """
        preferences, created = NotificationPreference.objects.get_or_create(
            user=self.request.user
        )
        return preferences
    
    def perform_update(self, serializer):
        """
        Update notification preferences.
        """
        old_values = self.get_object().__dict__
        serializer.save()
        
        # Log user action
        log_user_action(
            self.request,
            'update',
            'NotificationPreference',
            serializer.instance.id,
            old_values=old_values,
            new_values=serializer.data
        )


class BulkNotificationListCreateView(generics.ListCreateAPIView):
    """
    Bulk notification list and create view.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Get bulk notifications based on user role.
        """
        user = self.request.user
        
        if user.role == 'admin':
            return BulkNotification.objects.all()
        elif user.role == 'organizer':
            return BulkNotification.objects.filter(created_by=user)
        else:
            return BulkNotification.objects.none()
    
    def get_serializer_class(self):
        """
        Get appropriate serializer based on request method.
        """
        if self.request.method == 'POST':
            return BulkNotificationCreateSerializer
        return BulkNotificationSerializer
    
    def perform_create(self, serializer):
        """
        Create bulk notification.
        """
        bulk_notification = serializer.save(created_by=self.request.user)
        
        # Log user action
        log_user_action(
            self.request,
            'create',
            'BulkNotification',
            bulk_notification.id,
            new_values=serializer.data
        )


class BulkNotificationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Bulk notification detail view.
    """
    serializer_class = BulkNotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Get bulk notifications based on user role.
        """
        user = self.request.user
        
        if user.role == 'admin':
            return BulkNotification.objects.all()
        elif user.role == 'organizer':
            return BulkNotification.objects.filter(created_by=user)
        else:
            return BulkNotification.objects.none()


class BulkNotificationSendView(APIView):
    """
    Send bulk notification view.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, notification_id):
        """
        Send bulk notification.
        """
        try:
            bulk_notification = BulkNotification.objects.get(id=notification_id)
            
            # Check permissions
            user = request.user
            if not (
                user.role == 'admin' or
                bulk_notification.created_by == user
            ):
                return Response({
                    'error': True,
                    'message': 'Permission denied'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Check if already sent
            if bulk_notification.status in ['completed', 'sending']:
                return Response({
                    'error': True,
                    'message': 'Notification already sent'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get target users
            target_users = bulk_notification.get_target_users()
            
            # Create individual notifications
            notifications_created = 0
            for target_user in target_users:
                # Check user preferences
                try:
                    preferences = target_user.notification_preferences
                    if not preferences.should_send_notification(bulk_notification.type):
                        continue
                except NotificationPreference.DoesNotExist:
                    # Create default preferences if not exist
                    preferences = NotificationPreference.objects.create(user=target_user)
                
                notification = Notification.objects.create(
                    user=target_user,
                    title=bulk_notification.title,
                    message=bulk_notification.message,
                    type=bulk_notification.type,
                    priority=bulk_notification.priority,
                    action_url=bulk_notification.metadata.get('action_url'),
                    action_text=bulk_notification.metadata.get('action_text'),
                    metadata=bulk_notification.metadata
                )
                notifications_created += 1
            
            # Update bulk notification status
            bulk_notification.status = 'completed'
            bulk_notification.sent_at = timezone.now()
            bulk_notification.total_sent = notifications_created
            bulk_notification.save()
            
            # Log user action
            log_user_action(
                request,
                'send',
                'BulkNotification',
                bulk_notification.id,
                new_values={
                    'status': 'completed',
                    'total_sent': notifications_created
                }
            )
            
            return Response({
                'success': True,
                'message': f'Bulk notification sent to {notifications_created} users',
                'data': {
                    'total_sent': notifications_created,
                    'sent_at': bulk_notification.sent_at
                }
            })
            
        except BulkNotification.DoesNotExist:
            return Response({
                'error': True,
                'message': 'Bulk notification not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Bulk notification send error: {e}")
            return Response({
                'error': True,
                'message': 'Failed to send bulk notification'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class NotificationDeliveryLogListView(generics.ListAPIView):
    """
    Notification delivery log list view.
    """
    serializer_class = NotificationDeliveryLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['delivery_type', 'status']
    
    def get_queryset(self):
        """
        Get delivery logs based on user role.
        """
        user = self.request.user
        
        if user.role == 'admin':
            return NotificationDeliveryLog.objects.all()
        else:
            # Users can see delivery logs for their own notifications
            return NotificationDeliveryLog.objects.filter(
                notification__user=user
            )

class TelegramWebhookView(APIView):
    """
    Webhook endpoint for Telegram Bot.
    Handles:
      - /start org_<user_id>  → link organizer account
      - /start                → friendly welcome
      - approve_<reg_id>      → approve payment, notify user
      - reject_<reg_id>       → reject payment, notify user
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        try:
            data = request.data
            from apps.users.models import User
            from apps.events.models import EventRegistration
            from apps.core.utils import send_notification
            from .telegram_utils import send_telegram_message, answer_callback_query, edit_telegram_message_text
            
            # ── Handle standard text messages ──────────────────────────────────
            if "message" in data:
                message = data["message"]
                chat_id = message["chat"]["id"]
                text = message.get("text", "")

                if text.startswith("/start"):
                    parts = text.split(" ", 1)  # e.g. ["/start", "org_123"]
                    payload = parts[1] if len(parts) > 1 else ""

                    if payload.startswith("org_"):
                        # Link organizer account
                        try:
                            user_id = payload[4:]  # strip "org_"
                            user = User.objects.get(id=user_id)
                            user.telegram_chat_id = str(chat_id)
                            user.save(update_fields=['telegram_chat_id'])

                            send_telegram_message(
                                chat_id=chat_id,
                                text=(
                                    f"\u2705 <b>Account linked!</b>\n\n"
                                    f"Welcome, <b>{user.full_name}</b>!\n"
                                    f"You will now receive payment notifications for your events here.\n\n"
                                    f"\ud83d\udd14 When a participant uploads a payment receipt, you will get "
                                    f"an <b>Approve / Reject</b> button to verify it instantly."
                                )
                            )
                        except User.DoesNotExist:
                            send_telegram_message(chat_id, "\u274c Error: Invalid Organizer ID. Please use the connect link from the platform.")
                        except Exception as e:
                            logger.error(f"Telegram /start org_ error: {e}")
                            send_telegram_message(chat_id, "\u274c Something went wrong. Please try the link again.")
                    else:
                        # Bare /start — friendly greeting
                        send_telegram_message(
                            chat_id=chat_id,
                            text=(
                                "\U0001f44b <b>Welcome to CluboraxBot!</b>\n\n"
                                "This bot sends payment notifications to event organizers.\n\n"
                                "<b>To link your account:</b>\n"
                                "1\ufe0f\u20e3 Go to the CluboraxX platform\n"
                                "2\ufe0f\u20e3 Open your profile \u2192 <i>Connect Telegram</i>\n"
                                "3\ufe0f\u20e3 Click the generated link and you're done! \u2705"
                            )
                        )

            # ── Handle inline button callbacks ─────────────────────────────────
            elif "callback_query" in data:
                callback_query = data["callback_query"]
                callback_id    = callback_query["id"]
                actor_chat_id  = callback_query["message"]["chat"]["id"]
                message_id     = callback_query["message"]["message_id"]
                callback_data  = callback_query.get("data", "")

                # Format: action_registrationid  (e.g. "approve_<uuid>")
                parts = callback_data.split("_", 1)
                if len(parts) == 2:
                    action, reg_id = parts

                    try:
                        registration = EventRegistration.objects.select_related(
                            'event__created_by', 'user'
                        ).get(id=reg_id)

                        org   = registration.event.created_by
                        is_organizer_chat = str(org.telegram_chat_id) == str(actor_chat_id)

                        # Also allow admin users (any admin who received the message)
                        actor_user = User.objects.filter(
                            telegram_chat_id=str(actor_chat_id)
                        ).first()
                        is_admin_chat = actor_user and actor_user.role == 'admin'

                        if not (is_organizer_chat or is_admin_chat):
                            answer_callback_query(
                                callback_id,
                                text="\u274c Unauthorized! This action is not for you.",
                                show_alert=True
                            )
                            return Response({"status": "ok"})

                        # Determine who is acting
                        actor = actor_user if actor_user else org
                        approved_by_role = 'admin' if is_admin_chat else 'organizer'

                        if action == "approve":
                            registration.payment_status = 'verified'
                            registration.status         = 'confirmed'
                            registration.approved_by      = actor
                            registration.approved_by_role = approved_by_role
                            registration.save()
                            registration.generate_qr_code()

                            answer_callback_query(callback_id, text="\u2705 Payment Approved!")
                            edit_telegram_message_text(
                                chat_id=actor_chat_id,
                                message_id=message_id,
                                text=(
                                    f"\u2705 <b>Payment Approved</b>\n\n"
                                    f"<b>Event:</b> {registration.event.title}\n"
                                    f"<b>User:</b> {registration.user.full_name}\n"
                                    f"<b>Approved by:</b> {actor.full_name} ({approved_by_role})"
                                )
                            )

                            # Notify the student via in-app web notification
                            send_notification(
                                registration.user,
                                '\u2705 Payment Approved',
                                f'Your payment for "{registration.event.title}" has been approved! '
                                f'Your QR code is ready. Check your registrations.',
                                'payment_update'
                            )

                        elif action == "reject":
                            registration.payment_status = 'rejected'
                            registration.status         = 'cancelled'
                            registration.approved_by      = actor
                            registration.approved_by_role = approved_by_role
                            registration.save()

                            answer_callback_query(callback_id, text="\u274c Payment Rejected!")
                            edit_telegram_message_text(
                                chat_id=actor_chat_id,
                                message_id=message_id,
                                text=(
                                    f"\u274c <b>Payment Rejected</b>\n\n"
                                    f"<b>Event:</b> {registration.event.title}\n"
                                    f"<b>User:</b> {registration.user.full_name}\n"
                                    f"<b>Rejected by:</b> {actor.full_name} ({approved_by_role})"
                                )
                            )

                            # Notify the student via in-app web notification
                            send_notification(
                                registration.user,
                                '\u274c Payment Rejected',
                                f'Your payment for "{registration.event.title}" was rejected. '
                                f'Please re-upload a valid payment receipt.',
                                'payment_update'
                            )

                    except EventRegistration.DoesNotExist:
                        answer_callback_query(callback_id, text="Registration not found!", show_alert=True)
                        edit_telegram_message_text(actor_chat_id, message_id, "\u274c Registration not found or deleted.")
                else:
                    answer_callback_query(callback_id, text="Invalid action!")

            return Response({"status": "ok"})

        except Exception as e:
            logger.error(f"Telegram webhook error: {e}")
            return Response({"error": "Internal Server Error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TelegramConnectLinkView(APIView):
    """
    GET /api/notifications/telegram/connect-link/
    Returns the unique Telegram bot deep-link that lets the current user
    link their Telegram account.  Works for any role (organizer / admin).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from django.conf import settings

        bot_token = getattr(settings, 'TELEGRAM_BOT_TOKEN', '')
        if not bot_token:
            return Response(
                {'error': 'Telegram bot is not configured on this server.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        # Derive the bot username from the token via Telegram API
        import requests as req
        try:
            me = req.get(
                f'https://api.telegram.org/bot{bot_token}/getMe',
                timeout=5
            ).json()
            bot_username = me['result']['username']
        except Exception as e:
            logger.error(f"Failed to fetch bot username: {e}")
            return Response(
                {'error': 'Could not reach Telegram to get bot info.'},
                status=status.HTTP_502_BAD_GATEWAY
            )

        user = request.user
        connect_url = f"https://t.me/{bot_username}?start=org_{user.id}"

        return Response({
            'connect_url': connect_url,
            'bot_username': bot_username,
            'is_linked': bool(getattr(user, 'telegram_chat_id', None)),
            'telegram_chat_id': getattr(user, 'telegram_chat_id', None),
            'instructions': (
                'Click the connect_url link, then press START in Telegram. '
                'Your account will be linked automatically.'
            )
        })
