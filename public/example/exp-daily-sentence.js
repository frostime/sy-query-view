//!js
let dv = Query.DataView(protyle, item, top);
const today = Query.Utils.today();
const state = dv.useState(today);
if (state()) {
  dv.addmd('今天的每日一句')
  dv.addmd(`> ${state()}`)
} else {
fetch('https://api.xygeng.cn/one').then(async ans => {
 console.log(ans)
 if (ans.ok) {
    let data = await ans.json();
    console.log(data)
    state.value = `${data.data.content} —— ${data.data.origin}`;
    dv.addmd('今天的每日一句')
    dv.addmd(`> ${state.value}`)
 }
});
}
dv.render();