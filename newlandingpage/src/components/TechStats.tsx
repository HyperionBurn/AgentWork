import { motion } from "motion/react";

const stats = [
  { label: "Cost per TX", value: "$0.0001", suffix: "" },
  { label: "Settlement", value: "12", suffix: "ms" },
  { label: "Revenue Margin", value: "97.8", suffix: "%" },
  { label: "On-Chain TXs", value: "3,400", suffix: "+" },
];

export default function TechStats() {
  return (
    <section id="network" className="relative z-10 border-y border-white/5 bg-black/40 backdrop-blur-xl py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-x divide-white/5">
          {stats.map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="px-4 text-center first:border-l-0"
            >
              <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono mb-2">
                {stat.label}
              </div>
              <div className="font-display text-3xl md:text-5xl font-light text-white">
                {stat.value}<span className="text-orange-500">{stat.suffix}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
