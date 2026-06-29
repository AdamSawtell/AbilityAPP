-- Align the seeded availability maximum with the standard full-week default
-- availability template (Mon–Fri 09:00–17:00 = 40h/week = 80h/fortnight) so a
-- first-time save sits at the cap rather than tripping over-maximum approval.
-- Only adjusts the value where it still equals the original seeded default ('76');
-- organisations that have configured their own maximum are left untouched.
update public.system_setting
set value = '80'
where key = 'availability_max_hours_per_period'
  and value = '76';
