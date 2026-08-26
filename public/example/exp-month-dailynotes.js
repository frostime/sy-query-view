//!js
const monthStart = Query.utils.thisMonth(false);
const today = Query.utils.today(false);
const dailyNotes = await Query.dailynote({
    after: monthStart,
    before: today,
    limit: 32
});
return dailyNotes.pick('id');
