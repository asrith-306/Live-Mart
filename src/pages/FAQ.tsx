// src/pages/FAQ.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  ShoppingCart, 
  Package, 
  Truck, 
  CreditCard, 
  RotateCcw,
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  ArrowRight,
  Home
} from 'lucide-react';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  actionButton?: {
    text: string;
    route: string;
    icon?: React.ReactNode;
  };
}

const FAQ: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const categories = [
    { name: 'All', icon: <HelpCircle className="w-5 h-5" />, color: 'from-[#D97B7B] to-[#E59595]' },
    { name: 'Orders', icon: <ShoppingCart className="w-5 h-5" />, color: 'from-[#4A9FBE] to-[#6BB3CF]' },
    { name: 'Products', icon: <Package className="w-5 h-5" />, color: 'from-[#5FA889] to-[#7DBFA0]' },
    { name: 'Delivery', icon: <Truck className="w-5 h-5" />, color: 'from-[#D97B7B] to-[#E59595]' },
    { name: 'Payment', icon: <CreditCard className="w-5 h-5" />, color: 'from-[#6B7A8F] to-[#8A99AA]' },
    { name: 'Returns', icon: <RotateCcw className="w-5 h-5" />, color: 'from-[#D97B7B] to-[#E59595]' }
  ];

  const faqs: FAQItem[] = [
    {
      id: 'order-1',
      category: 'Orders',
      question: 'How do I place an order?',
      answer: 'Browse our products, add items to your cart, and proceed to checkout. You\'ll need to provide your delivery address and payment information to complete your order.',
      actionButton: { text: 'Start Shopping', route: '/customer', icon: <ShoppingCart className="w-4 h-4" /> }
    },
    {
      id: 'order-2',
      category: 'Orders',
      question: 'How can I track my order?',
      answer: 'Once your order is placed, you can track it in real-time from your orders page. You\'ll see the current status, estimated delivery time, and delivery partner information.',
      actionButton: { text: 'Track Orders', route: '/orders', icon: <Package className="w-4 h-4" /> }
    },
    {
      id: 'payment-4',
      category: 'Payment',
      question: 'Do you offer Cash on Delivery (COD)?',
      answer: 'Yes! We offer Cash on Delivery (COD) as a payment option. You can pay in cash when your order is delivered to your doorstep.',
      actionButton: { text: 'Shop Now', route: '/customer', icon: <ShoppingCart className="w-4 h-4" /> }
    },
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const handleActionClick = (route: string) => {
    if (route.startsWith('#')) {
      const element = document.querySelector(route);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(route);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F2F4F6] via-[#EDF2F7] to-[#EEF5F7] dark:from-[#1A2332] dark:via-[#1F2937] dark:to-[#1A2332]">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#4A9FBE] via-[#5AA5B0] to-[#5FA889] dark:from-[#5AA5B0] dark:via-[#6BB3CF] dark:to-[#7DBFA0] text-white py-16 px-8 shadow-2xl">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4 animate-fade-in">❓ Frequently Asked Questions</h1>
          <p className="text-xl opacity-90 mb-8">Find answers to common questions about orders, products, delivery, and more</p>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-[#6B7A8F] w-6 h-6" />
            <input
              type="text"
              placeholder="Search for questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 rounded-full text-[#2C3847] dark:text-[#E5E9EF] bg-[#FAFBFC] dark:bg-[#242D3C] text-lg shadow-lg focus:outline-none focus:ring-4 focus:ring-white/50 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Category Filter */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-[#2C3847] dark:text-[#E5E9EF] mb-6">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map(category => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`group relative px-4 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
                  selectedCategory === category.name
                    ? `bg-gradient-to-r ${category.color} text-white shadow-lg`
                    : 'bg-[#FAFBFC] dark:bg-[#242D3C] text-[#4A5568] dark:text-[#D1D8E0] hover:bg-[#EDF2F7] dark:hover:bg-[#1A2332] shadow-md border border-[#D8DEE6] dark:border-[#3A4555]'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  {category.icon}
                  <span className="text-sm">{category.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-lg text-[#4A5568] dark:text-[#D1D8E0]">
            <span className="font-semibold text-[#2C3847] dark:text-[#E5E9EF]">{filteredFAQs.length}</span> questions found
            {searchQuery && (
              <span className="ml-2">
                for "<span className="font-semibold text-[#4A9FBE] dark:text-[#6BB3CF]">{searchQuery}</span>"
              </span>
            )}
          </p>
        </div>

        {/* FAQ List */}
        {filteredFAQs.length > 0 ? (
          <div className="space-y-4">
            {filteredFAQs.map((faq, index) => (
              <div
                key={faq.id}
                className="bg-[#FAFBFC] dark:bg-[#242D3C] rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden animate-slide-up border border-[#D8DEE6] dark:border-[#3A4555]"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-[#EDF2F7] dark:hover:bg-[#1A2332] transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="px-3 py-1 bg-[#4A9FBE]/10 dark:bg-[#6BB3CF]/10 text-[#4A9FBE] dark:text-[#6BB3CF] rounded-full text-xs font-semibold">
                        {faq.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-[#2C3847] dark:text-[#E5E9EF] mt-2">{faq.question}</h3>
                  </div>
                  <div className="ml-4">
                    {expandedFAQ === faq.id ? (
                      <ChevronUp className="w-6 h-6 text-[#4A9FBE] dark:text-[#6BB3CF]" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-[#6B7A8F] dark:text-[#8A99AA]" />
                    )}
                  </div>
                </button>

                {expandedFAQ === faq.id && (
                  <div className="px-6 pb-6 animate-fade-in">
                    <div className="pt-4 border-t border-[#D8DEE6] dark:border-[#3A4555]">
                      <p className="text-[#4A5568] dark:text-[#D1D8E0] leading-relaxed mb-4">{faq.answer}</p>
                      
                      {faq.actionButton && (
                        <button
                          onClick={() => handleActionClick(faq.actionButton!.route)}
                          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#4A9FBE] to-[#5AA5B0] dark:from-[#6BB3CF] dark:to-[#5AA5B0] text-white font-semibold rounded-lg hover:from-[#3A7C96] hover:to-[#4A9FBE] dark:hover:from-[#4A9FBE] dark:hover:to-[#6BB3CF] transition-all transform hover:scale-105 shadow-md"
                        >
                          {faq.actionButton.icon}
                          {faq.actionButton.text}
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-8xl mb-6">🔍</div>
            <h3 className="text-2xl font-bold text-[#2C3847] dark:text-[#E5E9EF] mb-2">No questions found</h3>
            <p className="text-[#4A5568] dark:text-[#D1D8E0] mb-6">
              Try adjusting your search or browsing a different category
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="px-6 py-3 bg-gradient-to-r from-[#4A9FBE] to-[#5AA5B0] dark:from-[#6BB3CF] dark:to-[#5AA5B0] text-white font-semibold rounded-lg hover:shadow-lg transition-all transform hover:scale-105"
            >
              View All Questions
            </button>
          </div>
        )}

        {/* Contact Support Section */}
        <div id="contact" className="mt-16 bg-gradient-to-r from-[#4A9FBE] to-[#5AA5B0] dark:from-[#5AA5B0] dark:to-[#6BB3CF] rounded-2xl shadow-2xl p-8 text-white">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-3">Still Need Help?</h2>
            <p className="text-xl opacity-90">Our support team is here to assist you</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-center hover:bg-white/20 transition-all transform hover:scale-105">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">Call Us</h3>
              <p className="text-white/80 mb-4">Mon-Sat, 9 AM - 6 PM</p>
              <a href="tel:+911234567890" className="text-white font-semibold hover:underline">
                +91 123 456 7890
              </a>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-center hover:bg-white/20 transition-all transform hover:scale-105">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">Email Us</h3>
              <p className="text-white/80 mb-4">We'll respond within 24 hours</p>
              <a href="mailto:support@livemart.com" className="text-white font-semibold hover:underline">
                support@livemart.com
              </a>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-center hover:bg-white/20 transition-all transform hover:scale-105">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">Chat</h3>
              <p className="text-white/80 mb-4">Get support</p>
              <button className="text-white font-semibold hover:underline">
                Start Chat
              </button>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-12 text-center">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#FAFBFC] dark:bg-[#242D3C] text-[#4A9FBE] dark:text-[#6BB3CF] font-semibold rounded-lg hover:shadow-lg transition-all transform hover:scale-105 border border-[#D8DEE6] dark:border-[#3A4555]"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.4s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default FAQ;