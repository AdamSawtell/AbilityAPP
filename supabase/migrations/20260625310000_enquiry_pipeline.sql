-- Enquiry pipeline: loss reason for closed-lost enquiries (Chunk 0)

alter table public.enquiry
  add column if not exists loss_reason text not null default '';

-- Align legacy status labels with scope pipeline stages
update public.enquiry set status = '1_Enquiry received' where status = '1_Initial Enquiry';
update public.enquiry set status = '2_Qualification' where status = '2_To be processed';
update public.enquiry set status = '3_Proposal' where status = '3_In progress';
update public.enquiry set status = '5_Lost' where status = '5_Closed';
