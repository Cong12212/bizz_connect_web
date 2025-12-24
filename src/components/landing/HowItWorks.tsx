import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

interface Step {
    number: string;
    title: string;
    description: string;
    icon: string;
}

const HowItWorks: React.FC = () => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    });

    const steps: Step[] = [
        {
            number: '01',
            title: 'Đăng ký tài khoản',
            description: 'Tạo tài khoản miễn phí trong vài giây, không cần thẻ tín dụng',
            icon: '👤',
        },
        {
            number: '02',
            title: 'Thêm liên hệ',
            description: 'Import danh bạ hoặc thêm thủ công, tạo business card kỹ thuật số',
            icon: '📱',
        },
        {
            number: '03',
            title: 'Kết nối & Phát triển',
            description: 'Quản lý quan hệ, đặt nhắc nhở và theo dõi hiệu suất',
            icon: '🚀',
        },
    ];

    return (
        <section ref={ref} className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Cách hoạt động
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Ba bước đơn giản để bắt đầu hành trình kết nối của bạn
                    </p>
                </motion.div>

                {/* Steps */}
                <div className="relative">
                    {/* Connection line */}
                    <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-purple-200 via-blue-200 to-green-200 transform -translate-y-1/2"></div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
                        {steps.map((step, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 50 }}
                                animate={inView ? { opacity: 1, y: 0 } : {}}
                                transition={{ delay: idx * 0.2, duration: 0.8 }}
                                className="relative"
                            >
                                {/* Card */}
                                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-shadow duration-300 relative z-10">
                                    {/* Number badge */}
                                    <div className="absolute -top-6 left-8">
                                        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                            {idx + 1}
                                        </div>
                                    </div>

                                    {/* Icon */}
                                    <div className="text-6xl mb-6 mt-4">{step.icon}</div>

                                    {/* Content */}
                                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                        {step.title}
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>

                                {/* Arrow (mobile) */}
                                {idx < steps.length - 1 && (
                                    <div className="lg:hidden flex justify-center my-8">
                                        <svg className="w-8 h-8 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                        </svg>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;