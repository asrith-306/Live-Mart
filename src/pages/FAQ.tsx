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
    { name: 'All', icon: <HelpCircle className="w-5 h-5" />, color: 'from-purple-500 to-pink-500' },
    { name: 'Orders', icon: <ShoppingCart className="w-5 h-5" />, color: 'from-blue-500 to-cyan-500' },
    { name: 'Products', icon: <Package className="w-5 h-5" />, color: 'from-green-500 to-emerald-500' },
    { name: 'Delivery', icon: <Truck className="w-5 h-5" />, color: 'from-orange-500 to-amber-500' },
    { name: 'Payment', icon: <CreditCard className="w-5 h-5" />, color: 'from-indigo-500 to-purple-500' },
    { name: 'Returns', icon: <RotateCcw className="w-5 h-5" />, color: 'from-red-500 to-rose-500' }
  ];

  const faqs: FAQItem[] = [
    // Orders
    {
      id: 'order-1',
      category: 'Orders',
      question: 'How do I place an order?',
      answer: 'Browse our products, add items to your cart, and proceed to checkout. You\'ll need to provide your delivery address and payment information to complete your order.',
      actionButton: {
        text: 'Start Shopping',
        route: '/customer',
        icon: <ShoppingCart className="w-4 h-4" />
      }
    },
    {
      id: 'order-2',
      category: 'Orders',
      question: 'How can I track my order?',
      answer: 'Once your order is placed, you can track it in real-time from your orders page. You\'ll see the current status, estimated delivery time, and delivery partner information.',
      actionButton: {
        text: 'Track Orders',
        route: '/orders',
        icon: <Package className="w-4 h-4" />
      }
    },
    {
      id: 'order-3',
      category: 'Orders',
      question: 'Can I cancel my order?',
      answer: 'Yes, you can cancel your order within 15 minutes of placing it (while it\'s in "Confirmed" status). After that, the order moves to "Preparing" and cannot be cancelled.',
      actionButton: {
        text: 'View My Orders',
        route: '/orders',
        icon: <ShoppingCart className="w-4 h-4" />
      }
    },
    {
      id: 'order-4',
      category: 'Orders',
      question: 'How do I view my order history?',
      answer: 'All your past and current orders are available in your Orders page. You can view order details, track status, and download invoices.',
      actionButton: {
        text: 'Go to Orders',
        route: '/orders',
        icon: <Package className="w-4 h-4" />
      }
    },

    // Products
    {
      id: 'product-1',
      category: 'Products',
      question: 'How do I search for products?',
      answer: 'Use the search bar on the customer dashboard to find products by name or description. You can also filter by category, price range, and stock availability.',
      actionButton: {
        text: 'Browse Products',
        route: '/customer',
        icon: <Search className="w-4 h-4" />
      }
    },
    {
      id: 'product-2',
      category: 'Products',
      question: 'What does "Direct from Wholesaler" mean?',
      answer: 'Products marked "Direct from Wholesaler" are sourced directly from our wholesale partners. They offer the same quality but may have slightly longer delivery times.',
      actionButton: {
        text: 'See Products',
        route: '/customer',
        icon: <Package className="w-4 h-4" />
      }
    },
    {
      id: 'product-3',
      category: 'Products',
      question: 'How do I know if a product is in stock?',
      answer: 'Each product card displays the current stock status. You can also use our smart filters to show only products that are in stock or have low stock.',
      actionButton: {
        text: 'Check Availability',
        route: '/customer',
        icon: <Package className="w-4 h-4" />
      }
    },
    {
      id: 'product-4',
      category: 'Products',
      question: 'Do you offer product recommendations?',
      answer: 'Yes! Based on your purchase history, we show personalized product recommendations that match your interests.',
      actionButton: {
        text: 'Shop Now',
        route: '/customer',
        icon: <ShoppingCart className="w-4 h-4" />
      }
    },

    // Delivery
    {
      id: 'delivery-1',
      category: 'Delivery',
      question: 'How long does delivery take?',
      answer: 'Standard delivery takes 7 days from the order date. You can track your order in real-time to see the exact estimated delivery time.',
      actionButton: {
        text: 'Track Delivery',
        route: '/orders',
        icon: <Truck className="w-4 h-4" />
      }
    },
    {
      id: 'delivery-2',
      category: 'Delivery',
      question: 'Can I change my delivery address?',
      answer: 'You can change your delivery address within 15 minutes of placing the order. After that, the address cannot be modified.',
      actionButton: {
        text: 'My Orders',
        route: '/orders',
        icon: <Package className="w-4 h-4" />
      }
    },
    {
      id: 'delivery-3',
      category: 'Delivery',
      question: 'How do I contact my delivery partner?',
      answer: 'Once your order is out for delivery, you\'ll see your delivery partner\'s details on the tracking page. You can call them directly from there.',
      actionButton: {
        text: 'Track Order',
        route: '/orders',
        icon: <Phone className="w-4 h-4" />
      }
    },
    {
      id: 'delivery-4',
      category: 'Delivery',
      question: 'What if I\'m not home during delivery?',
      answer: 'Our delivery partners will call you before arrival. If you\'re not available, they can leave the package with a neighbor or attempt redelivery.',
      actionButton: {
        text: 'Contact Support',
        route: '#contact',
        icon: <MessageCircle className="w-4 h-4" />
      }
    },

    // Payment
    {
      id: 'payment-1',
      category: 'Payment',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit/debit cards, UPI, net banking, digital wallets, and Cash on Delivery (COD). Payment is processed securely through our payment gateway.',
      actionButton: {
        text: 'Start Shopping',
        route: '/customer',
        icon: <CreditCard className="w-4 h-4" />
      }
    },
    {
      id: 'payment-2',
      category: 'Payment',
      question: 'Is my payment information secure?',
      answer: 'Yes! All payment information is encrypted and processed through secure payment gateways. We never store your complete card details.',
      actionButton: {
        text: 'Learn More',
        route: '#security',
        icon: <HelpCircle className="w-4 h-4" />
      }
    },
    {
      id: 'payment-3',
      category: 'Payment',
      question: 'When will I be charged?',
      answer: 'For online payments, payment is processed immediately when you place your order. For Cash on Delivery (COD), you\'ll pay when your order is delivered to you.',
      actionButton: {
        text: 'View Orders',
        route: '/orders',
        icon: <Package className="w-4 h-4" />
      }
    },
    {
      id: 'payment-4',
      category: 'Payment',
      question: 'Do you offer Cash on Delivery (COD)?',
      answer: 'Yes! We offer Cash on Delivery (COD) as a payment option. You can pay in cash when your order is delivered to your doorstep. Online payment options are also available for faster processing.',
      actionButton: {
        text: 'Shop Now',
        route: '/customer',
        icon: <ShoppingCart className="w-4 h-4" />
      }
    },

    // Returns
    {
      id: 'return-1',
      category: 'Returns',
      question: 'What is your return policy?',
      answer: 'We offer a 7-day return policy from the date of delivery. Products must be unused and in original packaging to be eligible for return.',
      actionButton: {
        text: 'Return Policy',
        route: '#returns',
        icon: <RotateCcw className="w-4 h-4" />
      }
    },
    {
      id: 'return-2',
      category: 'Returns',
      question: 'How do I return a product?',
      answer: 'Contact our support team with your order ID. We\'ll arrange for pickup and process your refund once we receive the product.',
      actionButton: {
        text: 'Contact Support',
        route: '#contact',
        icon: <MessageCircle className="w-4 h-4" />
      }
    },
    {
      id: 'return-3',
      category: 'Returns',
      question: 'How long does it take to get a refund?',
      answer: 'Refunds are processed within 5-7 business days after we receive and verify the returned product. The amount will be credited to your original payment method.',
      actionButton: {
        text: 'My Orders',
        route: '/orders',
        icon: <Package className="w-4 h-4" />
      }
    },
    {
      id: 'return-4',
      category: 'Returns',
      question: 'Can I exchange a product?',
      answer: 'Yes! If you want to exchange a product for a different size or variant, contact our support team and we\'ll help you with the exchange process.',
      actionButton: {
        text: 'Contact Us',
        route: '#contact',
        icon: <Phone className="w-4 h-4" />
      }
    }
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
      // Scroll to section or handle anchor links
      const element = document.querySelector(route);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(route);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white py-16 px-8 shadow-2xl">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4 animate-fade-in">❓ Frequently Asked Questions</h1>
          <p className="text-xl opacity-90 mb-8">Find answers to common questions about orders, products, delivery, and more</p>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
            <input
              type="text"
              placeholder="Search for questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 rounded-full text-gray-800 text-lg shadow-lg focus:outline-none focus:ring-4 focus:ring-white/50 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Category Filter */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map(category => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`group relative px-4 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
                  selectedCategory === category.name
                    ? `bg-gradient-to-r ${category.color} text-white shadow-lg`
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  {category.icon}
                  <span className="text-sm">{category.name}</span>
                </div>
                {selectedCategory === category.name && (
                  <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-lg text-gray-600">
            <span className="font-semibold text-gray-800">{filteredFAQs.length}</span> questions found
            {searchQuery && (
              <span className="ml-2">
                for "<span className="font-semibold text-purple-600">{searchQuery}</span>"
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
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                        {faq.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mt-2">{faq.question}</h3>
                  </div>
                  <div className="ml-4">
                    {expandedFAQ === faq.id ? (
                      <ChevronUp className="w-6 h-6 text-purple-600" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                </button>

                {expandedFAQ === faq.id && (
                  <div className="px-6 pb-6 animate-fade-in">
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-gray-700 leading-relaxed mb-4">{faq.answer}</p>
                      
                      {faq.actionButton && (
                        <button
                          onClick={() => handleActionClick(faq.actionButton!.route)}
                          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-md"
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
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No questions found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search or browsing a different category
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all transform hover:scale-105"
            >
              View All Questions
            </button>
          </div>
        )}

        {/* Contact Support Section */}
        <div id="contact" className="mt-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8 text-white">
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
              <h3 className="font-bold text-lg mb-2">Live Chat</h3>
              <p className="text-white/80 mb-4">Get instant support</p>
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
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:shadow-lg transition-all transform hover:scale-105"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </button>
        </div>
      </div>

      {/* Animations */}
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