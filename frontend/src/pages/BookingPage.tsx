import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Shield, 
  CreditCard,
  ChevronLeft,
  User,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { cn } from '../utils/cn';

/**
 * 预订页面组件
 * 处理物品预订流程，包括日期选择、地址确认、支付等
 */
const BookingPage: React.FC = () => {
  const { resourceId } = useParams<{ resourceId: string }>();
  const [step, setStep] = useState(1);
  const [selectedDates, setSelectedDates] = useState({
    startDate: '',
    endDate: ''
  });
  const [deliveryMethod, setDeliveryMethod] = useState('pickup');
  const [paymentMethod, setPaymentMethod] = useState('alipay');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: ''
  });

  // 模拟物品数据
  const resource = {
    id: '1',
    title: '索尼 A7M4 全画幅相机',
    price: 150,
    unit: 'day',
    image: '/api/placeholder/400/300',
    owner: {
      name: '摄影师小王',
      phone: '13800138000',
      email: 'photographer@example.com',
      avatar: '/api/placeholder/100/100',
      verified: true,
      rating: 4.9,
      reviewCount: 156
    },
    location: {
      address: '北京市朝阳区三里屯街道工体北路8号院',
      pickup: true,
      delivery: true
    }
  };

  // 计算价格和天数
  const calculateDays = () => {
    if (!selectedDates.startDate || !selectedDates.endDate) return 0;
    const start = new Date(selectedDates.startDate);
    const end = new Date(selectedDates.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const calculateTotal = () => {
    const days = calculateDays();
    const rental = days * resource.price;
    const deposit = resource.price * 3; // 3天押金
    const serviceFee = Math.ceil(rental * 0.05); // 5%服务费
    return { rental, deposit, serviceFee, total: rental + deposit + serviceFee };
  };

  const prices = calculateTotal();

  // 步骤配置
  const steps = [
    { id: 1, title: '选择日期', icon: Calendar },
    { id: 2, title: '确认信息', icon: MapPin },
    { id: 3, title: '支付押金', icon: CreditCard }
  ];

  // 处理表单提交
  const handleNextStep = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // 渲染步骤内容
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6"
          >
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4"
            >
              <div className="flex items-start"
              >
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">预订须知</p>
                  <p className="text-sm text-blue-600 mt-1">
                    • 至少提前24小时预订
                    <br />
                    • 取还设备需出示有效身份证件
                    <br />
                    • 设备损坏需按市场价赔偿
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2"
                >开始日期</label>
                <input
                  type="date"
                  value={selectedDates.startDate}
                  onChange={(e) => setSelectedDates(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2"
                >结束日期</label>
                <input
                  type="date"
                  value={selectedDates.endDate}
                  onChange={(e) => setSelectedDates(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  min={selectedDates.startDate || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {selectedDates.startDate && selectedDates.endDate && (
              <div className="bg-neutral-50 rounded-lg p-4"
              >
                <p className="text-sm text-neutral-600 mb-2">租赁时长: <span className="font-semibold">{calculateDays()}天</span></p>
                <p className="text-sm text-neutral-600">预计租金: <span className="font-semibold text-primary-600">¥{prices.rental}</span></p>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6"
          >
            <div>
              <h3 className="text-lg font-semibold text-neutral-800 mb-4">联系方式</h3>
              <div className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2"
                  >姓名</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="请输入您的姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2"
                  >手机号</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="请输入您的手机号"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-neutral-800 mb-4">取还方式</h3>
              <div className="space-y-3"
              >
                <div className="flex items-center"
                >
                  <input
                    type="radio"
                    id="pickup"
                    value="pickup"
                    checked={deliveryMethod === 'pickup'}
                    onChange={(e) => setDeliveryMethod(e.target.value)}
                    className="w-4 h-4 text-primary-600"
                  />
                  <label htmlFor="pickup" className="ml-3 flex items-center cursor-pointer"
                  >
                    <MapPin className="w-5 h-5 text-neutral-400 mr-2" />
                    <div>
                      <p className="font-medium">到店自取</p>
                      <p className="text-sm text-neutral-600">{resource.location.address}</p>
                    </div>
                  </label>
                </div>
                <div className="flex items-center"
                >
                  <input
                    type="radio"
                    id="delivery"
                    value="delivery"
                    checked={deliveryMethod === 'delivery'}
                    onChange={(e) => setDeliveryMethod(e.target.value)}
                    className="w-4 h-4 text-primary-600"
                  />
                  <label htmlFor="delivery" className="ml-3 flex items-center cursor-pointer"
                  >
                    <MapPin className="w-5 h-5 text-neutral-400 mr-2" />
                    <div>
                      <p className="font-medium">送货上门</p>
                      <p className="text-sm text-neutral-600">需额外支付¥50配送费</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {deliveryMethod === 'delivery' && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2"
                >配送地址</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="请输入详细配送地址"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2"
              >备注信息（可选）</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                placeholder="有什么特别需求可以在这里说明"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6"
          >
            <div className="bg-green-50 border border-green-200 rounded-lg p-4"
            >
              <div className="flex items-center"
              >
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <p className="text-sm text-green-800">支付安全，由支付宝担保交易</p>
              </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-lg p-6"
            >
              <h3 className="text-lg font-semibold text-neutral-800 mb-4">订单详情</h3>
              <div className="space-y-3"
              >
                <div className="flex justify-between"
                >
                  <span className="text-neutral-600">租金 ({calculateDays()}天)</span>
                  <span className="font-medium">¥{prices.rental}</span>
                </div>
                <div className="flex justify-between"
                >
                  <span className="text-neutral-600">押金</span>
                  <span className="font-medium">¥{prices.deposit}</span>
                </div>
                <div className="flex justify-between"
                >
                  <span className="text-neutral-600">服务费 (5%)</span>
                  <span className="font-medium">¥{prices.serviceFee}</span>
                </div>
                {deliveryMethod === 'delivery' && (
                  <div className="flex justify-between"
                  >
                    <span className="text-neutral-600">配送费</span>
                    <span className="font-medium">¥50</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between font-semibold text-lg"
                >
                  <span>总计</span>
                  <span className="text-primary-600">¥{prices.total + (deliveryMethod === 'delivery' ? 50 : 0)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-lg p-6"
            >
              <h3 className="text-lg font-semibold text-neutral-800 mb-4">选择支付方式</h3>
              <div className="space-y-3"
              >
                {[
                  { id: 'alipay', name: '支付宝', icon: 'https://img.alicdn.com/imgextra/i4/O1CN01G0lm7A1uXU5H8KZJL_!!6000000006040-2-tps-200-200.png' },
                  { id: 'wechat', name: '微信支付', icon: 'https://res.wx.qq.com/a/wx_fed/assets/res/NTI4MWU5.png' },
                  { id: 'card', name: '银行卡', icon: '💳' }
                ].map((method) => (
                  <div key={method.id} className="flex items-center"
                  >
                    <input
                      type="radio"
                      id={method.id}
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4 text-primary-600"
                    />
                    <label htmlFor={method.id} className="ml-3 flex items-center cursor-pointer"
                    >
                      {method.icon.startsWith('http') ? (
                        <img src={method.icon} alt={method.name} className="w-6 h-6" />
                      ) : (
                        <span className="text-2xl">{method.icon}</span>
                      )}
                      <span className="ml-2">{method.name}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <div className="mb-8"
        >
          <Link
            to={`/resources/${resourceId}`}
            className="flex items-center text-neutral-600 hover:text-primary-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            返回物品详情
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* 步骤指示器 */}
          <div className="bg-neutral-50 px-8 py-6"
          >
            <div className="flex items-center justify-between"
            >
              {steps.map((stepItem, index) => (
                <div key={stepItem.id} className="flex items-center"
                >
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full",
                    stepItem.id <= step 
                      ? "bg-primary-500 text-white" 
                      : "bg-neutral-200 text-neutral-500"
                  )}
                  >
                    <stepItem.icon className="w-5 h-5" />
                  </div>
                  <span className={cn(
                    "ml-2 text-sm font-medium",
                    stepItem.id <= step 
                      ? "text-primary-600" 
                      : "text-neutral-500"
                  )}
                  >
                    {stepItem.title}
                  </span>
                  {index < steps.length - 1 && (
                    <div className="w-16 h-0.5 bg-neutral-200 mx-4" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* 左侧：物品信息 */}
              <div className="lg:col-span-2"
              >
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderStepContent()}
                </motion.div>
              </div>

              {/* 右侧：订单摘要 */}
              <div className="lg:col-span-1"
              >
                <div className="bg-neutral-50 rounded-xl p-6 sticky top-8"
                >
                  <h3 className="text-lg font-semibold text-neutral-800 mb-4">订单摘要</h3>
                  
                  <div className="flex items-center space-x-3 mb-4"
                  >
                    <img
                      src={resource.image}
                      alt={resource.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div>
                      <h4 className="font-medium text-neutral-800">{resource.title}</h4>
                      <p className="text-sm text-primary-600 font-bold">¥{resource.price}/天</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4"
                  >
                    <div className="flex justify-between text-sm"
                    >
                      <span className="text-neutral-600">租金 ({calculateDays()}天)</span>
                      <span className="font-medium">¥{prices.rental}</span>
                    </div>
                    <div className="flex justify-between text-sm"
                    >
                      <span className="text-neutral-600">押金</span>
                      <span className="font-medium">¥{prices.deposit}</span>
                    </div>
                    <div className="flex justify-between text-sm"
                    >
                      <span className="text-neutral-600">服务费 (5%)</span>
                      <span className="font-medium">¥{prices.serviceFee}</span>
                    </div>
                    {deliveryMethod === 'delivery' && (
                      <div className="flex justify-between text-sm"
                      >
                        <span className="text-neutral-600">配送费</span>
                        <span className="font-medium">¥50</span>
                      </div>
                    )}
                    <div className="border-t pt-3 flex justify-between font-semibold text-lg"
                    >
                      <span>总计</span>
                      <span className="text-primary-600">¥{prices.total + (deliveryMethod === 'delivery' ? 50 : 0)}</span>
                    </div>
                  </div>

                  <div className="border-t pt-4"
                  >
                    <h4 className="font-medium text-neutral-800 mb-3">房东信息</h4>
                    <div className="flex items-center space-x-3"
                    >
                      <img
                        src={resource.owner.avatar}
                        alt={resource.owner.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-medium text-neutral-800">{resource.owner.name}</p>
                        <p className="text-sm text-neutral-500">{resource.owner.rating}⭐ ({resource.owner.reviewCount}条评价)</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4"
                  >
                    <h4 className="font-medium text-neutral-800 mb-3">服务保障</h4>
                    <div className="space-y-2 text-sm"
                    >
                      {[
                        { icon: Shield, text: '押金担保交易' },
                        { icon: Clock, text: '24小时客服支持' },
                        { icon: User, text: '实名认证房东' }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center space-x-2"
                        >
                          <item.icon className="w-4 h-4 text-green-500" />
                          <span className="text-neutral-600">{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="flex justify-between px-8 pb-8"
            >
              <button
                onClick={handlePrevStep}
                disabled={step === 1}
                className={cn(
                  "px-6 py-2 rounded-lg font-medium transition-colors",
                  step === 1
                    ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                    : "bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                )}
              >
                上一步
              </button>
              
              <button
                onClick={handleNextStep}
                disabled={step === 3 || (step === 1 && (!selectedDates.startDate || !selectedDates.endDate))}
                className={cn(
                  "px-6 py-2 rounded-lg font-medium transition-colors",
                  step === 3 || (step === 1 && (!selectedDates.startDate || !selectedDates.endDate))
                    ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                    : "bg-primary-500 text-white hover:bg-primary-600"
                )}
              >
                {step === 3 ? '确认支付' : '下一步'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;