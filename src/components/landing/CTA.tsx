import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router-dom';

const CTA: React.FC = () => {
    const navigate = useNavigate();
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    });

    return (
        <section ref={ref} className="py-20 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-10 animate-blob"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-300 rounded-full mix-blend-overlay filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8 }}
                    className="text-center"
                >
                    {/* Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={inView ? { scale: 1 } : {}}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="inline-block text-7xl mb-8"
                    >
                        🚀
                    </motion.div>

                    {/* Headline */}
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Ready to transform the way you
                        <br />
                        connect your business?
                    </h2>

                    {/* Description */}
                    <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
                        Join thousands of businesses using Bizz-Connect to grow their network
                    </p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={inView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                    >
                        <button
                            onClick={() => navigate('/auth')}
                            className="group px-8 py-4 bg-white text-purple-600 font-semibold rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto"
                        >
                            <span className="flex items-center justify-center">
                                Get Started - Free
                                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </span>
                        </button>

                        {/* <button className="px-8 py-4 bg-transparent text-white font-semibold rounded-xl border-2 border-white/50 hover:bg-white/10 hover:border-white transition-all duration-300 w-full sm:w-auto">
                            View Demo
                        </button> */}
                    </motion.div>

                    {/* Trust indicator */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={inView ? { opacity: 1 } : {}}
                        transition={{ delay: 0.6, duration: 0.8 }}
                        className="mt-8 text-white/80 text-sm"
                    >
                        ✨ No credit card required • Cancel anytime
                    </motion.p>
                </motion.div>
            </div>
        </section>
    );
};

export default CTA;