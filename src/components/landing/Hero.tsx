import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Hero: React.FC = () => {
    const navigate = useNavigate();

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-purple-50 via-white to-blue-50">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="inline-flex items-center px-4 py-2 mb-8 text-sm font-medium text-purple-700 bg-purple-100 rounded-full"
                    >
                        <span className="mr-2">✨</span>
                        Kết nối thông minh - Phát triển bền vững
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight"
                    >
                        Kết nối doanh nghiệp
                        <br />
                        <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                            trong tầm tay
                        </span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed"
                    >
                        Nền tảng quản lý quan hệ khách hàng thông minh,
                        giúp doanh nghiệp kết nối và phát triển hiệu quả hơn
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.8 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                    >
                        <button
                            onClick={() => navigate('/auth')}
                            className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto"
                        >
                            <span className="relative z-10">Bắt đầu miễn phí</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-blue-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </button>

                        <button
                            onClick={() => navigate('/auth')}
                            className="px-8 py-4 bg-white text-gray-800 font-semibold rounded-xl border-2 border-gray-200 hover:border-purple-500 hover:text-purple-600 transform hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto"
                        >
                            Đăng nhập
                        </button>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9, duration: 0.8 }}
                        className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
                    >
                        {[
                            { number: '10K+', label: 'Doanh nghiệp' },
                            { number: '50K+', label: 'Người dùng' },
                            { number: '99%', label: 'Hài lòng' },
                        ].map((stat, idx) => (
                            <div key={idx} className="text-center">
                                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
                                    {stat.number}
                                </div>
                                <div className="text-sm md:text-base text-gray-600">{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>

                {/* Scroll indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                    className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
                >
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                        <span className="text-sm">Cuộn xuống</span>
                        <div className="w-6 h-10 border-2 border-gray-300 rounded-full flex justify-center">
                            <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-bounce"></div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default Hero;