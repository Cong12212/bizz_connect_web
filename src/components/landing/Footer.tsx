import React from 'react';

interface FooterLink {
    name: string;
    href: string;
}

interface FooterLinks {
    [key: string]: FooterLink[];
}

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    const footerLinks: FooterLinks = {
        product: [
            { name: 'Features', href: '#features' },
            { name: 'Pricing', href: '#pricing' },
            { name: 'Security', href: '#security' },
            { name: 'Roadmap', href: '#roadmap' },
        ],
        company: [
            { name: 'About Us', href: '#about' },
            { name: 'Blog', href: '#blog' },
            { name: 'Careers', href: '#careers' },
            { name: 'Contact', href: '#contact' },
        ],
        resources: [
            { name: 'Documentation', href: '#docs' },
            { name: 'API', href: '#api' },
            { name: 'Support', href: '#support' },
            { name: 'FAQ', href: '#faq' },
        ],
        legal: [
            { name: 'Terms', href: '#terms' },
            { name: 'Privacy', href: '#privacy' },
            { name: 'Cookies', href: '#cookies' },
            { name: 'License', href: '#license' },
        ],
    };

    const socialIcons = ['📘', '🐦', '📷', '💼'];

    const getCategoryTitle = (category: string): string => {
        const titles: Record<string, string> = {
            product: 'Product',
            company: 'Company',
            resources: 'Resources',
            legal: 'Legal',
        };
        return titles[category] || category;
    };

    return (
        <footer className="bg-gray-900 text-gray-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                                B
                            </div>
                            <span className="text-white font-bold text-xl">Bizz-Connect</span>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Smart business connection platform, helping you manage and grow your business network effectively.
                        </p>

                        <div className="flex gap-4 mt-6">
                            {socialIcons.map((icon, idx) => (
                                <a
                                    key={idx}
                                    href="#"
                                    className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center text-xl transition-colors duration-300"
                                >
                                    {icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {Object.entries(footerLinks).map(([category, links]) => (
                        <div key={category}>
                            <h3 className="text-white font-semibold mb-4">
                                {getCategoryTitle(category)}
                            </h3>
                            <ul className="space-y-3">
                                {links.map((link, idx) => (
                                    <li key={idx}>
                                        <a
                                            href={link.href}
                                            className="text-sm hover:text-white transition-colors duration-300"
                                        >
                                            {link.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="pt-8 border-t border-gray-800">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-gray-400">
                            © {currentYear} Bizz-Connect. All rights reserved.
                        </p>

                        <div className="flex items-center gap-6 text-sm">
                            <span className="text-gray-400">Made with ❤️ in Vietnam</span>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                <span className="text-gray-400">All systems operational</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;