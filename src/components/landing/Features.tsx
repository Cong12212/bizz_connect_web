import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

interface Feature {
    icon: string;
    title: string;
    description: string;
    gradient: string;
}

const Features: React.FC = () => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    });

    const features: Feature[] = [
        {
            icon: '🤝',
            title: 'Quản lý liên hệ thông minh',
            description: 'Lưu trữ và quản lý thông tin khách hàng, đối tác một cách có tổ chức và hiệu quả',
            gradient: 'from-purple-500 to-pink-500',
        },
        {
            icon: '📇',
            title: 'Business Card kỹ thuật số',
            description: 'Tạo và chia sẻ danh thiếp điện tử chuyên nghiệp, dễ dàng kết nối',
            gradient: 'from-blue-500 to-cyan-500',
        },
        {
            icon: '🔔',
            title: 'Nhắc nhở tự động',
            description: 'Không bỏ lỡ bất kỳ cuộc hẹn quan trọng nào với hệ thống reminder thông minh',
            gradient: 'from-green-500 to-emerald-500',
        },
        {
            icon: '📊',
            title: 'Phân tích & Báo cáo',
            description: 'Theo dõi hiệu suất và xu hướng kết nối với dashboard trực quan',
            gradient: 'from-orange-500 to-red-500',
        },
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
            },
        },
    };

    const item = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0 },
    };

    return (
        <section ref={ref} className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Tính năng nổi bật
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Tất cả những gì bạn cần để quản lý và phát triển mạng lưới kinh doanh
                    </p>
                </motion.div>

                {/* Features Grid */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate={inView ? 'show' : 'hidden'}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                >
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            variants={item}
                            whileHover={{ y: -10 }}
                            className="group relative bg-white p-8 rounded-2xl border-2 border-gray-100 hover:border-transparent hover:shadow-2xl transition-all duration-300"
                        >
                            {/* Gradient border on hover */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>

                            {/* Icon */}
                            <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center text-3xl mb-6 transform group-hover:scale-110 transition-transform duration-300`}>
                                {feature.icon}
                            </div>

                            {/* Content */}
                            <h3 className="text-xl font-bold text-gray-900 mb-3">
                                {feature.title}
                            </h3>
                            <p className="text-gray-600 leading-relaxed">
                                {feature.description}
                            </p>

                            {/* Arrow indicator */}
                            <div className="mt-6 flex items-center text-purple-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <span className="text-sm">Tìm hiểu thêm</span>
                                <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default Features;