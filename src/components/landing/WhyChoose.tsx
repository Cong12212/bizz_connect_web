import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

interface Benefit {
    title: string;
    description: string;
    icon: string;
}

const WhyChoose: React.FC = () => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    });

    const benefits: Benefit[] = [
        {
            title: 'Kết nối mọi lúc, mọi nơi',
            description: 'Truy cập từ mọi thiết bị, đồng bộ dữ liệu real-time',
            icon: '🌐',
        },
        {
            title: 'Bảo mật tuyệt đối',
            description: 'Mã hóa end-to-end, tuân thủ GDPR và các tiêu chuẩn quốc tế',
            icon: '🔒',
        },
        {
            title: 'Tích hợp linh hoạt',
            description: 'Kết nối với các công cụ yêu thích của bạn',
            icon: '🔗',
        },
        {
            title: 'Hỗ trợ 24/7',
            description: 'Đội ngũ support luôn sẵn sàng hỗ trợ bạn',
            icon: '💬',
        },
        {
            title: 'AI thông minh',
            description: 'Trợ lý AI giúp gợi ý và tối ưu quy trình làm việc',
            icon: '🤖',
        },
        {
            title: 'Miễn phí mãi mãi',
            description: 'Gói cơ bản hoàn toàn miễn phí, nâng cấp khi cần',
            icon: '🎁',
        },
    ];

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
                        Tại sao chọn Bizz-Connect?
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Những lý do khiến hàng ngàn doanh nghiệp tin tưởng chúng tôi
                    </p>
                </motion.div>

                {/* Benefits Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {benefits.map((benefit, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={inView ? { opacity: 1, scale: 1 } : {}}
                            transition={{ delay: idx * 0.1, duration: 0.5 }}
                            whileHover={{ scale: 1.05 }}
                            className="relative group"
                        >
                            <div className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl border-2 border-gray-100 hover:border-purple-200 transition-all duration-300">
                                {/* Icon */}
                                <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                                    {benefit.icon}
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-bold text-gray-900 mb-3">
                                    {benefit.title}
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {benefit.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Trust badges */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.8, duration: 0.8 }}
                    className="mt-20 text-center"
                >
                    <p className="text-gray-500 mb-8">Được tin tưởng bởi các tổ chức hàng đầu</p>
                    <div className="flex flex-wrap justify-center items-center gap-8 opacity-50">
                        {['🏢', '🏦', '🏭', '🏪', '🏛️'].map((icon, idx) => (
                            <div key={idx} className="text-6xl grayscale hover:grayscale-0 transition-all duration-300">
                                {icon}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default WhyChoose;