-- Align email template admin labels with Send via Email handoff naming

update public.app_document_email_template
set label = 'Support plan email'
where process_id = 'send-support-plan' and label = 'Send support plan';

update public.app_document_email_template
set label = 'Invoice email'
where process_id = 'send-invoice' and label = 'Issue invoice';
