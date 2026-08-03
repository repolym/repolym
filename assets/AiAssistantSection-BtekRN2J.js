import{c as O,r as l,N as R,d as J,Q as Ce,V as _e,j as e,W as le,_ as de,$ as me,a0 as G,a1 as U,a2 as Te,a3 as ze,a4 as Ae,a5 as Ee,u as qe,a6 as Re,a7 as X,a8 as Le,a9 as xe,aa as Oe,ab as Ze,ac as De,ad as Pe,T as He,Z as Je,ae as We}from"./index-DQslw2MO.js";/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Fe=[["path",{d:"M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z",key:"l5xja"}],["path",{d:"M9 13a4.5 4.5 0 0 0 3-4",key:"10igwf"}],["path",{d:"M6.003 5.125A3 3 0 0 0 6.401 6.5",key:"105sqy"}],["path",{d:"M3.477 10.896a4 4 0 0 1 .585-.396",key:"ql3yin"}],["path",{d:"M6 18a4 4 0 0 1-1.967-.516",key:"2e4loj"}],["path",{d:"M12 13h4",key:"1ku699"}],["path",{d:"M12 18h6a2 2 0 0 1 2 2v1",key:"105ag5"}],["path",{d:"M12 8h8",key:"1lhi5i"}],["path",{d:"M16 8V5a2 2 0 0 1 2-2",key:"u6izg6"}],["circle",{cx:"16",cy:"13",r:".5",key:"ry7gng"}],["circle",{cx:"18",cy:"3",r:".5",key:"1aiba7"}],["circle",{cx:"20",cy:"21",r:".5",key:"yhc1fs"}],["circle",{cx:"20",cy:"8",r:".5",key:"1e43v0"}]],Ie=O("brain-circuit",Fe);/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ke=[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}],["path",{d:"M12 7v5l4 2",key:"1fdv2h"}]],Qe=O("history",Ke);/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ue=[["path",{d:"M15 3h6v6",key:"1q9fwt"}],["path",{d:"m21 3-7 7",key:"1l2asr"}],["path",{d:"m3 21 7-7",key:"tjx5ai"}],["path",{d:"M9 21H3v-6",key:"wtvkvv"}]],Ve=O("maximize-2",Ue);/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Be=[["path",{d:"m14 10 7-7",key:"oa77jy"}],["path",{d:"M20 10h-6V4",key:"mjg0md"}],["path",{d:"m3 21 7-7",key:"tjx5ai"}],["path",{d:"M4 14h6v6",key:"rmj7iw"}]],Xe=O("minimize-2",Be);/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ye=[["path",{d:"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",key:"1ffxy3"}],["path",{d:"m21.854 2.147-10.94 10.939",key:"12cjpa"}]],Ge=O("send",Ye);/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const et=[["path",{d:"M10 5H3",key:"1qgfaw"}],["path",{d:"M12 19H3",key:"yhmn1j"}],["path",{d:"M14 3v4",key:"1sua03"}],["path",{d:"M16 17v4",key:"1q0r14"}],["path",{d:"M21 12h-9",key:"1o4lsq"}],["path",{d:"M21 19h-5",key:"1rlt1p"}],["path",{d:"M21 5h-7",key:"1oszz2"}],["path",{d:"M8 10v4",key:"tgpxqk"}],["path",{d:"M8 12H3",key:"a7s4jb"}]],tt=O("sliders-horizontal",et),st=s=>{const[r,o]=l.useState([]),[c,i]=l.useState(!1),[S,y]=l.useState(null),$=l.useRef(!0),u=l.useCallback(async(f=!1)=>{if(s&&!(c&&!f)){i(!0),y(null);try{const{data:d,error:m}=await R.from("chat_sessions").select("*").eq("user_id",s).is("deleted_at",null).order("updated_at",{ascending:!1});if(m)throw m;$.current&&o(d||[])}catch(d){const m=J(d);y(m)}finally{$.current&&i(!1)}}},[s]);l.useEffect(()=>($.current=!0,u(),()=>{$.current=!1}),[u]);const a=l.useCallback(async(f={})=>{if(!s)return null;try{const d={user_id:s,title:f.title||null,messages:f.messages||[]},{data:m,error:w}=await R.from("chat_sessions").insert(d).select().single();if(w)throw w;return await u(!0),m}catch(d){return y(J(d)),null}},[s,u]),k=l.useCallback(async(f,d)=>{if(!s)return null;try{const m={...d,updated_at:new Date().toISOString()},{data:w,error:C}=await R.from("chat_sessions").update(m).eq("id",f).eq("user_id",s).select().single();if(C)throw C;return await u(!0),w}catch(m){return y(J(m)),null}},[s,u]),L=l.useCallback(async f=>{if(!s)return!1;try{const{error:d}=await R.from("chat_sessions").delete().eq("id",f).eq("user_id",s);if(d)throw d;return await u(!0),!0}catch(d){return y(J(d)),!1}},[s,u]),M=l.useCallback(async(f,d)=>{if(!s)return null;try{const{data:m,error:w}=await R.from("chat_sessions").select("messages").eq("id",f).single();if(w)throw w;const Z=[...(m==null?void 0:m.messages)||[],...d];return await k(f,{messages:Z})}catch(m){return y(J(m)),null}},[s,k]);return{sessions:r,loading:c,error:S,refetch:u,createSession:a,updateSession:k,deleteSession:L,appendMessages:M}},rt=["message","summary","content","text","response","answer"],ue=["recommendations","strengths","weaknesses"],at=s=>{const r=s.trim(),o=/^```(?:json|javascript|js)?\s*([\s\S]*?)\s*```$/i.exec(r);return o?o[1].trim():r},he=s=>{const r=s.trim();return r.startsWith("{")&&r.endsWith("}")||r.startsWith("[")&&r.endsWith("]")},pe=s=>{if(typeof s=="string")return s;if(s==null)return"";if(Array.isArray(s))return s.map(r=>`• ${typeof r=="string"?r:JSON.stringify(r)}`).join(`
`);if(typeof s=="object"){const r=s;for(const o of rt){const c=r[o];if(typeof c=="string"&&c.trim()){let i=c.trim();if(he(i))try{return pe(JSON.parse(i))}catch{return i}const S=[];for(const y of ue){const $=r[y];if(Array.isArray($)&&$.length>0){const u=y==="strengths"?"نقاط قوت":y==="weaknesses"?"نقاط ضعف":"پیشنهادات";S.push(`

**${u}:**
`+$.map(a=>`- ${a}`).join(`
`))}}return i+S.join("")}}for(const o of ue){const c=r[o];if(Array.isArray(c)&&c.length>0)return c.map(i=>`- ${i}`).join(`
`)}return Object.entries(r).filter(([,o])=>o!=null&&o!=="").map(([o,c])=>`**${o}:** ${typeof c=="string"?c:JSON.stringify(c)}`).join(`
`)}return String(s)},Y=s=>{if(!s)return s;let r=s;return r=r.replace(/(?:^|\n)\[\s*\n?([\s\S]*?)\n?\s*\](?=\n|$)/g,(o,c)=>{const i=c.trim();return/\\(frac|partial|nabla|sum|int|sqrt|sin|cos|tan|theta|alpha|beta|gamma|mathbb|vec|lim|left|right|begin|end)/.test(i)||/[=^_{}]/.test(i)?`

$$
${i}
$$

`:`
${i}
`}),r=r.replace(/\\\(([\s\S]*?)\\\)/g,(o,c)=>`$${c.trim()}$`),r=r.replace(/\\\[([\s\S]*?)\\\]/g,(o,c)=>`

$$
${c.trim()}
$$

`),r=r.replace(/\(([^)]*)\)/g,(o,c)=>{const i=c.trim();return/\\(frac|partial|nabla|sum|int|sqrt|sin|cos|tan|theta|alpha|beta|gamma|mathbb|vec|lim|left|right|begin|end)/.test(i)||/[=^_{}]/.test(i)?o.trim()===o&&!o.includes(" ")?`

$$
${i}
$$

`:`$${i}$`:/^[a-zA-Z0-9_\s]+$/.test(i)&&i.length<20?`$${i}$`:o}),r=r.replace(new RegExp("(?<![$\\\\])(\\\\frac{[^}]*}{[^}]*}|\\\\nabla|\\\\partial|\\\\sum|\\\\int|\\\\sqrt{[^}]*}|\\\\mathbb{[A-Z]}|\\\\vec{[a-zA-Z]}|\\\\lim|\\\\begin{[a-zA-Z]*})","g"),o=>`$${o}$`),r=r.replace(/\$\s+/g,"$"),r=r.replace(/\s+\$/g,"$"),r=r.replace(/\$\$\s+/g,"$$"),r=r.replace(/\s+\$\$/g,"$$"),r},W=s=>{if(!s)return"";const r=at(s);if(!he(r))return Y(r);try{const o=JSON.parse(r),c=pe(o);return Y(c||r)}catch{return Y(r)}},nt=`
  .ai-markdown .katex {
    direction: ltr !important;
    unicode-bidi: embed;
  }
  .ai-markdown .katex-display {
    direction: ltr !important;
    unicode-bidi: embed;
    text-align: center !important;
    margin: 0.75em 0;
    overflow-x: auto;
    overflow-y: hidden;
  }
  .ai-markdown .katex-display > .katex {
    display: inline-block;
    text-align: left;
  }
  .ai-markdown .katex .mathnormal,
  .ai-markdown .katex .mord,
  .ai-markdown .katex .mbin,
  .ai-markdown .katex .mrel,
  .ai-markdown .katex .mopen,
  .ai-markdown .katex .mclose,
  .ai-markdown .katex .mpunct,
  .ai-markdown .katex .minner {
    direction: ltr !important;
    unicode-bidi: embed;
  }
  .dark .ai-markdown {
    color: #e5e7eb !important;
  }
  .dark .ai-markdown .text-text-primary {
    color: #e5e7eb !important;
  }
  .dark .ai-markdown .text-text-secondary {
    color: #9ca3af !important;
  }
  .dark .ai-markdown h1,
  .dark .ai-markdown h2,
  .dark .ai-markdown h3,
  .dark .ai-markdown strong {
    color: #f3f4f6 !important;
  }
  .dark .ai-markdown code {
    background: #374151 !important;
    color: #e5e7eb !important;
  }
  .dark .ai-markdown blockquote {
    background: rgba(55, 65, 81, 0.5) !important;
    color: #d1d5db !important;
  }
  .dark .ai-markdown table th {
    background: #374151 !important;
    color: #f3f4f6 !important;
  }
  .dark .ai-markdown table td {
    color: #d1d5db !important;
  }
  .dark .ai-markdown table {
    border-color: #4b5563 !important;
  }
  .dark .ai-markdown .border-border-subtle {
    border-color: #374151 !important;
  }
`,ot=({content:s,isUser:r=!1})=>{const{theme:o}=Ce(),c=l.useMemo(()=>W(s),[s]),[i,S]=_e.useState(!1),y=o==="dark"||o==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches,$=y?Ae:Ee,u=async()=>{try{await navigator.clipboard.writeText(s),S(!0),setTimeout(()=>S(!1),2e3)}catch{const a=document.createElement("textarea");a.value=s,document.body.appendChild(a),a.select(),document.execCommand("copy"),document.body.removeChild(a),S(!0),setTimeout(()=>S(!1),2e3)}};return r?e.jsxs("div",{className:"relative group",children:[e.jsx("div",{className:"ai-markdown prose prose-sm max-w-none text-text-primary",children:e.jsx(le,{remarkPlugins:[me],rehypePlugins:[[de,{throwOnError:!1,trust:!1,macros:{"\\R":"\\mathbb{R}","\\N":"\\mathbb{N}","\\Z":"\\mathbb{Z}","\\Q":"\\mathbb{Q}"}}]],children:c})}),e.jsx("button",{onClick:u,className:"absolute -left-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-border text-text-tertiary hover:text-text-primary",title:"کپی پیام",children:i?e.jsx(G,{className:"w-3.5 h-3.5 text-green-500"}):e.jsx(U,{className:"w-3.5 h-3.5"})})]}):c.trim()?e.jsxs("div",{className:"ai-markdown text-sm leading-relaxed break-words w-full max-w-full text-text-primary relative group",children:[e.jsx("style",{children:nt}),e.jsx("button",{onClick:u,className:"absolute -left-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-border text-text-tertiary hover:text-text-primary z-10",title:"کپی پیام",children:i?e.jsx(G,{className:"w-3.5 h-3.5 text-green-500"}):e.jsx(U,{className:"w-3.5 h-3.5"})}),e.jsx(le,{remarkPlugins:[me],rehypePlugins:[[de,{throwOnError:!1,trust:!1,macros:{"\\R":"\\mathbb{R}","\\N":"\\mathbb{N}","\\Z":"\\mathbb{Z}","\\Q":"\\mathbb{Q}"}}]],components:{p:({children:a})=>e.jsx("p",{className:"mb-3 last:mb-0 whitespace-pre-line leading-relaxed text-text-primary",children:a}),ul:({children:a})=>e.jsx("ul",{className:"list-disc pr-5 mb-3 space-y-1.5 text-text-primary",children:a}),ol:({children:a})=>e.jsx("ol",{className:"list-decimal pr-5 mb-3 space-y-1.5 text-text-primary",children:a}),li:({children:a})=>e.jsx("li",{className:"text-text-primary leading-relaxed",children:a}),strong:({children:a})=>e.jsx("strong",{className:"font-bold text-text-primary",children:a}),em:({children:a})=>e.jsx("em",{className:"italic text-text-secondary",children:a}),h1:({children:a})=>e.jsx("h1",{className:"text-xl font-bold mb-3 mt-4 first:mt-0 text-text-primary border-b border-border-subtle pb-2",children:a}),h2:({children:a})=>e.jsx("h2",{className:"text-lg font-bold mb-2.5 mt-3 first:mt-0 text-text-primary",children:a}),h3:({children:a})=>e.jsx("h3",{className:"text-base font-bold mb-2 mt-2.5 first:mt-0 text-text-primary",children:a}),blockquote:({children:a})=>e.jsx("blockquote",{className:"border-r-4 border-accent pr-4 my-3 py-1 bg-surface-2/30 rounded-r-lg text-text-secondary",children:a}),code:({className:a,children:k,...L})=>{if(!a)return e.jsx("code",{className:"bg-surface-3 dark:bg-gray-700 text-accent-hover dark:text-gray-200 px-1.5 py-0.5 rounded-md text-xs font-mono whitespace-pre-wrap break-words",...L,children:k});const f=/language-(\w+)/.exec(a||""),d=f?f[1]:"text",m=String(k).replace(/\n$/,"");return e.jsxs("div",{className:"relative my-3 rounded-xl overflow-hidden border border-border-subtle dark:border-gray-700",children:[e.jsxs("div",{className:"flex items-center justify-between px-4 py-2 bg-surface-3/50 dark:bg-gray-800 border-b border-border-subtle dark:border-gray-700 text-xs text-text-secondary dark:text-gray-400",children:[e.jsx("span",{className:"font-mono uppercase text-[10px] tracking-wider",children:d}),e.jsxs("button",{onClick:()=>navigator.clipboard.writeText(m),className:"flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-surface-3 dark:hover:bg-gray-700 transition-colors text-text-tertiary dark:text-gray-400 hover:text-text-primary dark:hover:text-gray-200",children:[e.jsx(U,{className:"w-3.5 h-3.5"}),e.jsx("span",{className:"text-[10px]",children:"کپی کد"})]})]}),e.jsx(ze,{language:d,style:$,customStyle:{margin:0,padding:"16px",fontSize:"13px",lineHeight:"1.6",background:y?"#1e1e1e":"#f8f8f8",borderRadius:0},wrapLines:!0,wrapLongLines:!0,children:m})]})},pre:({children:a})=>e.jsx(e.Fragment,{children:a}),table:({children:a})=>e.jsx("div",{className:"overflow-x-auto my-3 rounded-xl border border-border-subtle dark:border-gray-700",children:e.jsx("table",{className:"w-full text-sm border-collapse",children:a})}),th:({children:a})=>e.jsx("th",{className:"border border-border-subtle dark:border-gray-700 px-4 py-2.5 bg-surface-2 dark:bg-gray-800 text-right font-semibold text-text-primary dark:text-gray-200",children:a}),td:({children:a})=>e.jsx("td",{className:"border border-border-subtle dark:border-gray-700 px-4 py-2.5 text-text-secondary dark:text-gray-300",children:a}),hr:()=>e.jsx("hr",{className:"my-4 border-border-subtle dark:border-gray-700"}),a:({href:a,children:k})=>e.jsx("a",{href:a,target:"_blank",rel:"noopener noreferrer",className:"text-accent hover:text-accent-hover underline transition-colors",children:k})},children:c})]}):e.jsxs("div",{className:"flex items-center gap-2 text-amber-600 text-sm",children:[e.jsx(Te,{className:"w-4 h-4 flex-shrink-0"}),e.jsx("span",{children:"پاسخ دریافتی قابل نمایش نبود. لطفاً دوباره تلاش کنید."})]})},lt=()=>{const{user:s}=qe(),{showToast:r}=Re(),{sessions:o,loading:c,createSession:i,updateSession:S,deleteSession:y,refetch:$}=st((s==null?void 0:s.id)??null),[u,a]=l.useState([]),[k,L]=l.useState(""),[M,f]=l.useState(!1),[d,m]=l.useState(""),[w,C]=l.useState(null),[Z,F]=l.useState(!1),[I,fe]=l.useState("medium"),[V,ee]=l.useState(!1),[E,te]=l.useState(!1),[D,K]=l.useState(""),[be,se]=l.useState(!1),re=l.useRef(null),ge=l.useRef(null),ae="https://pebhpwclsnxcokwhligh.supabase.co/functions/v1/ai-assistant",ne=()=>{te(!E)};l.useEffect(()=>{const t=n=>{n.key==="Escape"&&E&&te(!1)};return window.addEventListener("keydown",t),()=>window.removeEventListener("keydown",t)},[E]);const oe=t=>{C(t.id),a(t.messages||[]),F(!1),K("")},ye=async()=>{const t=await i({title:"گفتگوی جدید"});t&&(C(t.id),a([]),F(!1),K(""))},we=async(t,n)=>{if(n.stopPropagation(),!confirm("آیا از حذف این گفتگو اطمینان دارید؟"))return;await y(t)?(r("گفتگو حذف شد","success"),w===t&&(C(null),a([]),K(""))):r("خطا در حذف گفتگو","error")},P=async(t,n)=>{await S(t,{messages:n})},ke=async(t,n)=>{var x;f(!0),m("");try{const{data:{session:h}}=await R.auth.getSession(),b=h==null?void 0:h.access_token,z={...n,complexity:I,stream:!0},j=await fetch(ae,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${b}`},body:JSON.stringify({action:t,data:z})});if(!j.ok)throw new Error(`HTTP error ${j.status}`);const q=(x=j.body)==null?void 0:x.getReader();if(!q)throw new Error("No response body");const _=new TextDecoder;let N="",v="";for(;;){const{done:ce,value:A}=await q.read();if(ce)break;v+=_.decode(A,{stream:!0});const p=v.split(`
`);v=p.pop()||"";for(const T of p)if(T.startsWith("data: "))try{const g=JSON.parse(T.slice(6));if(g.type==="chunk"&&g.content)N+=g.content,m(N);else{if(g.type==="done")return N;if(g.type==="error")throw new Error(g.message||"Unknown error")}}catch{}}return W(N)||"پاسخی دریافت نشد"}catch{const b="ارتباط با دستیار هوشمند برقرار نشد. لطفاً دوباره تلاش کنید.";return r(b,"error"),`⚠️ ${b}`}finally{f(!1),m("")}},B=async(t,n)=>{var h,b,z,j,q;f(!0);const x=!1;try{const{data:{session:_}}=await R.auth.getSession(),N=_==null?void 0:_.access_token,v={...n,complexity:I},A=await(await fetch(ae,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${N}`},body:JSON.stringify({action:t,data:v})})).json();if(!A.success){const p=x?A.error||"خطا در پاسخ هوش مصنوعی":"ارتباط با دستیار هوشمند برقرار نشد. لطفاً دوباره تلاش کنید.";throw new Error(p)}if(t==="chat")return W((h=A.data)==null?void 0:h.message)||"پاسخی دریافت نشد";if(t==="analyze"){const p=A.data;let T=W(p.summary)||"";return(b=p.strengths)!=null&&b.length&&(T+=`

**نقاط قوت:**
`+p.strengths.map(g=>`- ${g}`).join(`
`)),(z=p.weaknesses)!=null&&z.length&&(T+=`

**نقاط ضعف:**
`+p.weaknesses.map(g=>`- ${g}`).join(`
`)),(j=p.recommendations)!=null&&j.length&&(T+=`

**پیشنهادات:**
`+p.recommendations.map(g=>`- ${g}`).join(`
`)),p.motivation&&(T+=`

---

`+p.motivation),T||"تحلیل کامل شد، اما داده‌ای برای نمایش وجود ندارد."}if(t==="recommend"){const p=A.data||{};let g=`**پیشنهادات هوشمند:**
`+(p.recommendations||[]).map(Me=>`- ${Me}`).join(`
`);return p.insight&&(g+=`

**بینش کلی:** `+p.insight),p.next_step&&(g+=`

**گام بعدی شما:** `+p.next_step),g||"پیشنهادی برای نمایش وجود ندارد."}return t==="summarize"?W((q=A.data)==null?void 0:q.summary)||"خلاصه‌سازی انجام نشد.":"عملیات ناشناخته"}catch{const N="ارتباط با دستیار هوشمند برقرار نشد. لطفاً دوباره تلاش کنید.";return r(N,"error"),`⚠️ ${N}`}finally{f(!1)}},je=async t=>{if(t.preventDefault(),!k.trim()||M)return;let n=w;if(!n){const v=await i({title:k.trim().slice(0,50)});if(!v){r("خطا در ایجاد گفتگو","error");return}n=v.id,C(n)}const x={role:"user",content:k},h=[...u,x];a(h),L(""),await P(n,h);const b=h.map(v=>({role:v.role,content:v.content})),q={role:"assistant",content:await ke("chat",{messages:b,userId:s==null?void 0:s.id})},_=[...h,q];a(_),m(""),await P(n,_);const N=o.find(v=>v.id===n);N&&(!N.title||N.title==="گفتگوی جدید")&&x.content.length>10&&(await S(n,{title:x.content.slice(0,50)+"..."}),$())},Ne=[{label:"تحلیل عملکرد ماهانه",icon:e.jsx(Ie,{className:"w-4 h-4"}),description:"دریافت تحلیل کامل عملکرد و نقاط قوت و ضعف",action:async()=>{let t=w;if(!t){const b=await i({title:"تحلیل عملکرد"});if(!b)return;t=b.id,C(t)}const x={role:"assistant",content:await B("analyze",{userId:s==null?void 0:s.id,period:"month"})},h=[...u,x];a(h),await P(t,h)}},{label:"برنامه مطالعه شخصی‌سازی‌شده",icon:e.jsx(He,{className:"w-4 h-4"}),description:"دریافت برنامه مطالعه اختصاصی بر اساس داده‌های شما",action:async()=>{let t=w;if(!t){const b=await i({title:"برنامه مطالعه"});if(!b)return;t=b.id,C(t)}const x={role:"assistant",content:await B("recommend",{userId:s==null?void 0:s.id,goal:"بهبود عملکرد کلی"})},h=[...u,x];a(h),await P(t,h)}},{label:"نکته انگیزشی روز",icon:e.jsx(Je,{className:"w-4 h-4"}),description:"یک پیام انگیزشی متناسب با سطح شما",action:async()=>{let t=w;if(!t){const j=await i({title:"انگیزش"});if(!j)return;t=j.id,C(t)}const h=(await B("analyze",{userId:s==null?void 0:s.id,period:"week"})).split(`
`).filter(j=>j.includes("---")||j.includes("💪")||j.includes("🚀")),b={role:"assistant",content:h.length>0?h.join(`
`):"به راه خود ادامه دهید. هر روز قدمی به جلو! 💪"},z=[...u,b];a(z),await P(t,z)}},{label:"پرسش درسی",icon:e.jsx(We,{className:"w-4 h-4"}),description:"سوالات درسی خود را بپرسید و پاسخ دقیق دریافت کنید",action:async()=>{const t=document.querySelector('input[type="text"]');t&&t.focus()}}];l.useEffect(()=>{var t;(t=re.current)==null||t.scrollIntoView({behavior:"smooth"})},[u,d]),l.useEffect(()=>{if(o.length>0&&!w){const t=o[0];oe(t)}},[o]);const ie={simple:"ساده و سریع",medium:"متوسط",advanced:"پیشرفته و تحلیلی"},ve={simple:"پاسخ‌های مختصر و سریع",medium:"پاسخ‌های متعادل",advanced:"تحلیل عمیق با مدل پیشرفته"},Q=l.useMemo(()=>{const t=[...u];if(M&&d){const n=t[t.length-1];if((n==null?void 0:n.role)==="assistant"){const x=[...t];return x[x.length-1]={...n,content:d},x}else return[...t,{role:"assistant",content:d}]}return t},[u,M,d]),H=l.useMemo(()=>{if(!D.trim())return Q;const t=D.trim().toLowerCase();return Q.filter(n=>n.content.toLowerCase().includes(t))},[Q,D]),Se=async()=>{const t=H.map(n=>`${n.role==="user"?"👤 کاربر":"🤖 Repolym"}:
${n.content}`).join(`

---

`);try{await navigator.clipboard.writeText(t),se(!0),setTimeout(()=>se(!1),2e3),r("مکالمه کپی شد!","success")}catch{r("خطا در کپی کردن","error")}},$e=E?"fixed inset-0 z-50 bg-surface-1 rounded-none border-0 p-4 sm:p-6 flex flex-col h-screen max-h-none min-h-screen":"bg-surface-1 rounded-2xl border border-border p-4 sm:p-6 flex flex-col h-[75vh] max-h-[700px] min-h-[450px]";return e.jsxs("div",{ref:ge,className:$e,dir:"rtl",children:[e.jsxs("div",{className:"flex items-center justify-between pb-3 border-b border-border mb-3 flex-wrap gap-2 shrink-0",children:[e.jsxs("div",{className:"flex items-center gap-3 min-w-0",children:[e.jsx("button",{onClick:()=>F(!Z),className:"p-2 rounded-xl hover:bg-surface-2 transition-colors flex-shrink-0",children:Z?e.jsx(X,{className:"w-5 h-5"}):e.jsx(Le,{className:"w-5 h-5"})}),e.jsx("div",{className:"p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex-shrink-0",children:e.jsx(xe,{className:"w-6 h-6 text-white"})}),e.jsxs("div",{className:"min-w-0",children:[e.jsx("h2",{className:"text-base sm:text-lg font-bold text-text-primary truncate",children:"مربی هوشمند Repolym"}),e.jsx("p",{className:"text-xs sm:text-sm text-text-secondary truncate",children:"دستیار شخصی شما برای موفقیت در المپیاد"})]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("button",{onClick:ne,className:"p-2 rounded-xl hover:bg-surface-2 transition-colors text-text-secondary hover:text-text-primary",title:E?"خروج از تمام صفحه":"تمام صفحه",children:E?e.jsx(Xe,{className:"w-5 h-5"}):e.jsx(Ve,{className:"w-5 h-5"})}),e.jsxs("div",{className:"relative",children:[e.jsxs("button",{onClick:()=>ee(!V),className:`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors border ${V?"border-accent bg-accent-muted text-accent-hover":"border-border hover:bg-surface-2 text-text-secondary"}`,children:[e.jsx(tt,{className:"w-4 h-4"}),e.jsx("span",{className:"hidden sm:inline",children:ie[I]})]}),V&&e.jsx("div",{className:"absolute left-0 top-full mt-2 w-52 bg-surface-1 border border-border rounded-xl shadow-lg p-2 z-20",children:["simple","medium","advanced"].map(t=>e.jsxs("button",{onClick:()=>{fe(t),ee(!1)},className:`w-full text-right px-3 py-2 rounded-lg text-sm transition-colors ${I===t?"bg-accent-muted text-accent-hover":"hover:bg-surface-2 text-text-secondary"}`,children:[e.jsx("div",{className:"font-medium",children:ie[t]}),e.jsx("div",{className:"text-xs text-text-tertiary",children:ve[t]})]},t))})]}),e.jsxs("button",{onClick:ye,className:"flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors flex-shrink-0 shadow-md",children:[e.jsx(Oe,{className:"w-4 h-4"}),e.jsx("span",{className:"hidden sm:inline",children:"گفتگوی جدید"})]})]})]}),e.jsxs("div",{className:"flex items-center gap-2 mb-3 shrink-0",children:[e.jsxs("div",{className:"relative flex-1",children:[e.jsx(Ze,{className:"absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary"}),e.jsx("input",{type:"text",value:D,onChange:t=>K(t.target.value),placeholder:"جستجو در مکالمات...",className:"w-full bg-surface-2 border border-border rounded-xl px-9 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50"})]}),e.jsxs("button",{onClick:Se,className:"flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-2 hover:bg-surface-3 border border-border transition-colors text-sm text-text-secondary hover:text-text-primary",title:"کپی کل مکالمه",children:[be?e.jsx(G,{className:"w-4 h-4 text-green-500"}):e.jsx(U,{className:"w-4 h-4"}),e.jsx("span",{className:"hidden sm:inline text-xs",children:"کپی همه"})]}),D&&e.jsxs("span",{className:"text-xs text-text-tertiary whitespace-nowrap",children:[H.length," از ",Q.length]})]}),e.jsxs("div",{className:"flex flex-1 min-h-0 relative",children:[Z&&e.jsxs("div",{className:"absolute inset-0 z-10 bg-surface-1 rounded-2xl border border-border p-3 flex flex-col gap-2 overflow-y-auto",children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsxs("h3",{className:"text-sm font-semibold text-text-secondary flex items-center gap-2",children:[e.jsx(Qe,{className:"w-4 h-4"}),"تاریخچه گفتگوها"]}),e.jsx("button",{onClick:()=>F(!1),className:"p-1 rounded-lg hover:bg-surface-2",children:e.jsx(X,{className:"w-4 h-4"})})]}),c?e.jsx("div",{className:"text-center py-4 text-text-tertiary",children:"در حال بارگذاری..."}):o.length===0?e.jsxs("div",{className:"text-center py-8 text-text-tertiary text-sm",children:["هنوز گفتگویی ندارید.",e.jsx("br",{}),"با دکمه «گفتگوی جدید» شروع کنید."]}):o.map(t=>e.jsxs("div",{onClick:()=>oe(t),className:`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${t.id===w?"bg-accent-muted":"hover:bg-surface-2"}`,children:[e.jsx("span",{className:"text-sm truncate max-w-[80%]",children:t.title||"گفتگوی جدید"}),e.jsx("button",{onClick:n=>we(t.id,n),className:"p-1 rounded-lg text-text-tertiary hover:text-red-500 transition-colors flex-shrink-0",children:e.jsx(De,{className:"w-3.5 h-3.5"})})]},t.id))]}),e.jsxs("div",{className:"flex-1 flex flex-col min-h-0",children:[e.jsxs("div",{className:"flex-1 overflow-y-auto overflow-x-hidden space-y-4 mb-4 p-2 bg-surface-2 rounded-xl border border-border/50",children:[H.length===0&&!M?e.jsxs("div",{className:"h-full flex flex-col items-center justify-center text-text-secondary gap-3 p-4 sm:p-6 text-center",children:[e.jsx("div",{className:"w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center",children:e.jsx(xe,{className:"w-8 h-8 text-indigo-600"})}),e.jsx("p",{className:"font-bold text-lg text-text-primary",children:"به مربی هوشمند Repolym خوش آمدید"}),e.jsx("p",{className:"text-sm max-w-sm text-text-secondary",children:"سوالات درسی، تحلیل عملکرد، برنامه مطالعه و نکات انگیزشی — همه در یک جا"}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 w-full max-w-md",children:Ne.map((t,n)=>e.jsxs("button",{onClick:t.action,disabled:M,className:"flex items-center gap-3 bg-white border border-border hover:border-accent hover:shadow-md rounded-xl px-4 py-3 text-right transition-all disabled:opacity-50",children:[e.jsx("div",{className:"w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center text-indigo-600",children:t.icon}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("p",{className:"text-xs font-bold text-text-primary",children:t.label}),e.jsx("p",{className:"text-2xs text-text-tertiary truncate",children:t.description})]})]},n))})]}):H.map((t,n)=>{const x=t.role==="user";return e.jsx("div",{className:`flex ${x?"justify-start":"justify-end"} w-full`,children:e.jsxs("div",{className:`max-w-[90%] sm:max-w-[85%] min-w-0 rounded-2xl px-3 sm:px-4 py-3 text-sm leading-relaxed shadow-sm ${x?"bg-accent-muted text-accent-hover rounded-tr-none border border-accent-subtle/30":"bg-surface-1 border border-border text-text-primary rounded-tl-none"}`,children:[e.jsx(ot,{content:t.content,isUser:x}),n===H.length-1&&M&&d&&!x&&e.jsx("span",{className:"inline-block w-1.5 h-4 bg-accent animate-pulse ml-1"})]})},n)}),M&&!d&&e.jsx("div",{className:"flex justify-end",children:e.jsxs("div",{className:"bg-surface-1 border border-border rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2 text-sm text-text-secondary shadow-sm",children:[e.jsx(Pe,{className:"w-4 h-4 animate-spin text-accent"}),e.jsx("span",{children:"در حال نوشتن پاسخ..."})]})}),e.jsx("div",{ref:re})]}),e.jsxs("form",{onSubmit:je,className:"flex gap-2 shrink-0",children:[e.jsx("input",{type:"text",value:k,onChange:t=>L(t.target.value),placeholder:"سوال خود را اینجا بنویسید...",disabled:M,className:"flex-1 min-w-0 bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors disabled:opacity-50 text-right"}),e.jsx("button",{type:"submit",disabled:M||!k.trim(),className:"p-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-colors disabled:opacity-40 flex items-center justify-center flex-shrink-0 shadow-md",children:e.jsx(Ge,{className:"w-4 h-4 rotate-180"})})]})]})]}),E&&e.jsx("button",{onClick:ne,className:"absolute top-4 left-4 p-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-text-secondary hover:text-text-primary transition-colors z-50",title:"خروج از تمام صفحه",children:e.jsx(X,{className:"w-5 h-5"})})]})};export{lt as AiAssistantSection,lt as default};
