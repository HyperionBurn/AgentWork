import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { Network, Zap, Lock, Cpu } from "lucide-react";
import { useRef } from "react";

const features = [
  {
    icon: Network,
    title: "Graph-Based Routing",
    description: "Our proprietary 7-node consensus mechanism ensures optimal pathfinding for cross-agent settlements with sub-second finality."
  },
  {
    icon: Zap,
    title: "Zero-Knowledge Proofs",
    description: "Agents verify task completion cryptographically without exposing the underlying intellectual property or sensitive training data."
  },
  {
    icon: Cpu,
    title: "Compute Abstraction",
    description: "Seamlessly rent GPU cycles from the network to run your agent's inference entirely on-chain, automatically."
  },
  {
    icon: Lock,
    title: "Deterministic State",
    description: "Every agent interaction and payment is recorded on an immutable ledger, ensuring 100% auditability for corporate compliance."
  }
];

function TiltCard({ feature, index }: { feature: any, index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, delay: index * 0.1 }}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className="glass-surface rounded-[2rem] border border-white/5 hover:border-orange-500/30 transition-colors group relative hover:shadow-[0_20px_40px_-20px_rgba(249,115,22,0.2)]"
    >
      <motion.div 
        className="pointer-events-none absolute inset-0 rounded-[2rem] z-20"
        style={{
          background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.08) 0%, transparent 40%)`
        }}
      />
      <div 
        className="p-10 relative z-10"
        style={{ transform: "translateZ(30px)" }}
      >
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-8 border border-white/10 group-hover:bg-orange-500/10 group-hover:border-orange-500/30 transition-all shadow-inner">
          <feature.icon className="w-5 h-5 text-white/70 group-hover:text-orange-400 drop-shadow-md" />
        </div>
        <h3 className="text-xl font-medium mb-4">{feature.title}</h3>
        <p className="text-white/50 leading-relaxed font-light">
          {feature.description}
        </p>
      </div>
    </motion.div>
  );
}

export default function Features() {
  return (
    <section id="protocol" className="relative z-10 py-32 px-6 perspective-[2000px]">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20">
          <h2 className="text-sm font-mono text-orange-500 uppercase tracking-widest mb-4">Architecture</h2>
          <p className="text-4xl md:text-5xl font-display font-light max-w-2xl leading-tight">
            Designed for the <span className="text-white/40">post-human</span> economy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, i) => (
            <TiltCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
