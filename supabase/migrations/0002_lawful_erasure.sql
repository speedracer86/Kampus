/* Erasure has to stay possible (law 1's other half).

   0001 locked `events` against UPDATE and DELETE twice over: no policy, no
   grant, and a trigger that refuses every caller including the table's owner.
   The trigger did its job the first time a family was deleted — and that is the
   bug. A parent can ask for their child's data to be removed, and for a product
   with children's records in it that is not a feature request, it is the law.
   With the trigger as written, `delete from families where id = …` fails on the
   cascade and there is no way to honour the request short of dropping the
   trigger by hand, in production, under time pressure.

   So the trigger now distinguishes an ACCIDENT from an INTENTION. It still
   refuses every ordinary delete — a migration, a dashboard query, a mistyped
   statement — but a session that has explicitly said it is erasing may cascade:

     begin;
       set local app.erasing = 'on';
       delete from public.families where id = '…';
     commit;

   UPDATE is still refused outright, with no way around it. Deleting a subject
   and editing a fact are different acts: the first is a person exercising a
   right, the second is the log lying. Clients cannot do either — they hold
   neither grant — so this changes nothing about what a browser can reach. */

create or replace function app.events_are_append_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' and coalesce(current_setting('app.erasing', true), '') = 'on' then
    return old;
  end if;
  raise exception 'events is append-only (% attempted)', tg_op
    using hint = tg_op || ': facts are never edited. To erase a subject, set app.erasing = ''on'' in the transaction.';
end
$$;
