import { useState, type FormEvent, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Eye, EyeOff, Factory, Globe2, KeyRound, LoaderCircle, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { useAuth } from './lib/auth'
import { isCloudConfigured } from './lib/supabase'

const copy = {
  en: {
    secure: 'Secure business access', title: 'Welcome back', subtitle: 'Sign in to manage inventory, accounts and factory operations.', email: 'Email address', password: 'Password', signIn: 'Sign in', signingIn: 'Signing in…', forgot: 'Forgot password?', reset: 'Send reset link', resetSent: 'Password reset instructions were sent.', configured: 'Authentication is ready. Add users later in Supabase Authentication.', missing: 'Add the Supabase URL and publishable key to enable authentication.', language: 'తెలుగు', protected: 'Protected by Supabase Auth', show: 'Show password', hide: 'Hide password', back: 'Back to sign in', required: 'Enter your email and password.', resetRequired: 'Enter your email address first.',
  },
  te: {
    secure: 'సురక్షిత వ్యాపార ప్రవేశం', title: 'తిరిగి స్వాగతం', subtitle: 'నిల్వ, ఖాతాలు మరియు ఫ్యాక్టరీ కార్యకలాపాలను నిర్వహించడానికి సైన్ ఇన్ చేయండి.', email: 'ఈమెయిల్ చిరునామా', password: 'పాస్‌వర్డ్', signIn: 'సైన్ ఇన్', signingIn: 'సైన్ ఇన్ అవుతోంది…', forgot: 'పాస్‌వర్డ్ మర్చిపోయారా?', reset: 'రీసెట్ లింక్ పంపండి', resetSent: 'పాస్‌వర్డ్ రీసెట్ సూచనలు పంపబడ్డాయి.', configured: 'ఆథెంటికేషన్ సిద్ధంగా ఉంది. Supabase Authenticationలో వినియోగదారులను తర్వాత జోడించండి.', missing: 'ఆథెంటికేషన్ కోసం Supabase URL మరియు పబ్లిషబుల్ కీని జోడించండి.', language: 'English', protected: 'Supabase Auth ద్వారా రక్షించబడింది', show: 'పాస్‌వర్డ్ చూపించండి', hide: 'పాస్‌వర్డ్ దాచండి', back: 'సైన్ ఇన్‌కు తిరిగి వెళ్లండి', required: 'ఈమెయిల్ మరియు పాస్‌వర్డ్ నమోదు చేయండి.', resetRequired: 'ముందుగా మీ ఈమెయిల్ చిరునామాను నమోదు చేయండి.',
  },
} as const

export default function AuthGate({ children }: { children: ReactNode }) {
  const { loading, user, signIn, resetPassword } = useAuth()
  const [language, setLanguage] = useState<'en' | 'te'>('en')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)
  const t = copy[language]

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-ink text-white"><LoaderCircle className="animate-spin text-brass" size={28}/></div>
  if (user) return children

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setMessage(null)
    if (resetMode) {
      if (!email.trim()) return setMessage({ tone: 'error', text: t.resetRequired })
      setSubmitting(true)
      const error = await resetPassword(email.trim())
      setSubmitting(false)
      setMessage(error ? { tone: 'error', text: error } : { tone: 'success', text: t.resetSent })
      return
    }
    if (!email.trim() || !password) return setMessage({ tone: 'error', text: t.required })
    setSubmitting(true)
    const error = await signIn(email.trim(), password)
    setSubmitting(false)
    if (error) setMessage({ tone: 'error', text: error })
  }

  return <main className="relative min-h-screen overflow-hidden bg-[#e9e5dc] text-ink">
    <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_15%_20%,rgba(183,138,71,.34),transparent_30%),radial-gradient(circle_at_85%_80%,rgba(29,78,63,.22),transparent_34%)]"/>
    <div className="relative mx-auto grid min-h-screen max-w-[1440px] lg:grid-cols-[1.05fr_.95fr]">
      <section className="grain relative hidden overflow-hidden bg-ink px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brass text-ink"><Factory size={25}/></span><div><p className="font-display text-lg font-extrabold">Sri Mallikarjuna Industries</p><p className="text-xs uppercase tracking-[.18em] text-white/45">Cashew processing ERP</p></div></div>
        <div className="max-w-xl"><span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.06] px-3 py-1.5 text-xs font-semibold text-white/70"><ShieldCheck size={14} className="text-brass"/>{t.secure}</span><h1 className="font-display text-5xl font-extrabold leading-[1.08]">Your factory ledger.<br/><span className="text-[#d6a75f]">Private by default.</span></h1><p className="mt-6 max-w-lg text-base leading-7 text-white/55">{t.subtitle}</p></div>
        <p className="flex items-center gap-2 text-xs text-white/40"><LockKeyhole size={14}/>{t.protected}</p>
      </section>
      <section className="flex items-center justify-center p-5 sm:p-10">
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="w-full max-w-md rounded-[28px] border border-black/[0.07] bg-[#fffdf8] p-6 shadow-2xl shadow-black/10 sm:p-9">
          <div className="mb-8 flex items-start justify-between"><div><div className="mb-5 flex items-center gap-3 lg:hidden"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-brass"><Factory size={21}/></span><p className="font-display text-sm font-extrabold">Sri Mallikarjuna Industries</p></div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-brass">{t.secure}</p><h2 className="mt-2 font-display text-3xl font-extrabold">{resetMode ? t.forgot : t.title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{resetMode ? t.resetRequired : t.subtitle}</p></div><button type="button" onClick={()=>setLanguage(value=>value==='en'?'te':'en')} className="icon-btn !w-auto gap-2 px-3" aria-label="Switch language"><Globe2 size={15}/><span className="text-xs font-bold">{t.language}</span></button></div>
          {!isCloudConfigured && <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-800">{t.missing}</div>}
          <form onSubmit={submit} className="space-y-4">
            <label><span className="label">{t.email}</span><span className="relative block"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17}/><input type="email" autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} className="input !pl-10" placeholder="owner@example.com"/></span></label>
            {!resetMode && <label><span className="label">{t.password}</span><span className="relative block"><KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17}/><input type={showPassword?'text':'password'} autoComplete="current-password" value={password} onChange={event=>setPassword(event.target.value)} className="input !px-10" placeholder="••••••••"/><button type="button" onClick={()=>setShowPassword(value=>!value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-ink" aria-label={showPassword?t.hide:t.show}>{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></span></label>}
            <AnimatePresence mode="wait">{message&&<motion.p key={message.text} initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`rounded-xl p-3 text-xs font-semibold ${message.tone==='error'?'bg-red-50 text-red-700':'bg-emerald-50 text-emerald-700'}`}>{message.text}</motion.p>}</AnimatePresence>
            <button disabled={submitting||!isCloudConfigured} className="btn-primary mt-2 w-full !py-3" type="submit">{submitting?<><LoaderCircle className="animate-spin" size={16}/>{t.signingIn}</>:resetMode?<><Mail size={16}/>{t.reset}</>:<><LockKeyhole size={16}/>{t.signIn}</>}</button>
          </form>
          <button type="button" onClick={()=>{setResetMode(value=>!value);setMessage(null)}} className="mt-5 w-full text-center text-xs font-bold text-pine hover:underline">{resetMode?t.back:t.forgot}</button>
          <p className="mt-7 border-t border-black/[0.06] pt-5 text-center text-[11px] leading-5 text-slate-400">{t.configured}</p>
        </motion.div>
      </section>
    </div>
  </main>
}
