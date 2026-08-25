import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, MessageCircle, Target, Trophy, Quote } from "lucide-react";
import { Nav } from "../components/Nav";

const fade = { hidden: { opacity: 0, y: 24 }, visible: (i=0) => ({ opacity: 1, y: 0, transition: { delay: 0.08 * i, duration: 0.7, ease: [0.22,1,0.36,1] }})};

export const Home = ({ onLogin }) => (
  <>
    <Nav onLogin={onLogin}/>
    <main className="home">
      <div className="grain" aria-hidden/>
      <section className="hero">
        <motion.div className="hero-copy" initial="hidden" animate="visible">
          <motion.p className="eyebrow red" variants={fade} custom={0}>THE PRACTICE ROOM FOR AMBITIOUS THINKERS</motion.p>
          <motion.h1 variants={fade} custom={1}>Think clearly.<br/><em>Under pressure.</em></motion.h1>
          <motion.p className="hero-sub" variants={fade} custom={2}>
            A case interviewer that doesn&apos;t give away the answer. Build the structure, ask sharper questions,
            and earn your edge — one rep at a time.
          </motion.p>
          <motion.div className="hero-actions" variants={fade} custom={3}>
            <Link to="/library" className="primary" data-testid="hero-start-button">
              Enter the practice room <ArrowRight size={18}/>
            </Link>
            <a href="#method" className="ghost" data-testid="hero-method-link">See how it works <ChevronRight size={16}/></a>
          </motion.div>
          <motion.div className="proof" variants={fade} custom={4}>
            <div><strong>101</strong><span>curated cases</span></div>
            <div><strong>24/7</strong><span>on-demand practice</span></div>
            <div><strong>1:1</strong><span>interviewer focus</span></div>
          </motion.div>
        </motion.div>

        <motion.div className="hero-visual" initial={{opacity:0, scale:1.02}} animate={{opacity:1, scale:1}} transition={{duration:1.1, ease:[0.22,1,0.36,1]}}>
          <div className="visual-frame">
            <img src="https://images.pexels.com/photos/7433898/pexels-photo-7433898.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" alt="Consultant presenting a growth chart"/>
            <div className="visual-scrim"/>
          </div>
          <motion.div className="visual-note" initial={{x:20, opacity:0}} animate={{x:0, opacity:1}} transition={{delay:0.6, duration:0.6}}>
            <span className="live-dot"/>LIVE SIMULATION
            <div className="quote"><Quote size={12}/>I can&apos;t solve it for you — what&apos;s your next step?</div>
          </motion.div>
          <div className="vertical-label">CASE PRACTICE · 01</div>
          <div className="floating-tag tag-a">STRUCTURE ▸ FIRST</div>
          <div className="floating-tag tag-b">DATA ▸ ON DEMAND</div>
        </motion.div>
      </section>

      <section className="method" id="method">
        <motion.div initial={{opacity:0, y:30}} whileInView={{opacity:1, y:0}} viewport={{once:true, amount:0.4}} transition={{duration:0.7}}>
          <p className="eyebrow">A BETTER REPETITION</p>
          <h2>Every question<br/><em>counts.</em></h2>
          <p className="method-sub">Three habits, drilled into muscle memory. This is what separates a first-round pass from an offer.</p>
        </motion.div>
        <div className="method-grid">
          {[
            { icon: <MessageCircle/>, title: "Ask with intent", body: "The interviewer reveals only what you earn by asking. Relevant questions move the case forward; scattergun questions cost you." },
            { icon: <Target/>, title: "Think in public", body: "Structure before data. Make assumptions explicit. Turn a messy prompt into a clean, MECE path a partner would follow." },
            { icon: <Trophy/>, title: "Leave with proof", body: "A scorecard on five dimensions — structuring, data efficiency, math, synthesis, creativity — with a next-time nudge." },
          ].map((m, i) => (
            <motion.article key={m.title} initial={{opacity:0, y:30}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{delay:0.1*i, duration:0.6}}>
              <span>0{i+1}</span>
              {m.icon}
              <h3>{m.title}</h3>
              <p>{m.body}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="cta-band">
        <div>
          <p className="eyebrow">READY WHEN YOU ARE</p>
          <h2>Book your <em>first rep</em>.</h2>
          <p>Six archetypes. Ninety-five FMS casebook practice cases. One patient, unflinching interviewer.</p>
        </div>
        <Link to="/library" className="primary" data-testid="cta-library-button">Open the case library <ArrowRight size={16}/></Link>
      </section>
    </main>
  </>
);
