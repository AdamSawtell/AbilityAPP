-- Invoice template: optional rich-text footer clause block (editable in System template editor)
insert into public.app_document_template_block (id, template_id, block_type, label, content_html, sort_order, locked)
values
  (
    'dtblk-invoice-notes',
    'dtax-invoice-ndis-v1',
    'rich-text',
    'Payment terms',
    '<p>Payment is due by the due date shown above. Please include the invoice number as your payment reference.</p>',
    6,
    false
  )
on conflict (id) do update set
  block_type = excluded.block_type,
  label = excluded.label,
  content_html = excluded.content_html,
  sort_order = excluded.sort_order,
  locked = excluded.locked;
