//!js
const monthStart = Query.utils.thisMonth('date');
const today = Query.utils.today('date');
const dailyNotes = await Query.dailynote({
    after: monthStart,
    before: today,
    limit: 32
});
return dailyNotes.pick('id');
