
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getPosterApiKey, setPosterApiKey } from "@/services/posterService";
import { toast } from "sonner";

interface ApiKeyInputProps {
  onApiKeySet: () => void;
}

const ApiKeyInput = ({ onApiKeySet }: ApiKeyInputProps) => {
  const [apiKey, setApiKey] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      toast.error("请输入API密钥");
      return;
    }
    
    setPosterApiKey(apiKey.trim());
    toast.success("API密钥已设置");
    onApiKeySet();
  };

  return (
    <div className="p-6 bg-dark-4 rounded-lg max-w-md mx-auto my-10">
      <h2 className="text-xl font-bold mb-4">设置API密钥</h2>
      <p className="text-bright-5 mb-6 text-sm">
        请设置你的阿里云 DashScope API 密钥以使用海报生成功能。
        API 密钥仅存储在您的浏览器中，不会被发送到其他服务器。
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="apiKey" className="form-label">
            DashScope API 密钥
          </label>
          <div className="relative">
            <Input
              id="apiKey"
              type={isVisible ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="bg-dark-3 border-dark-1 pr-10"
              placeholder="输入您的 DashScope API 密钥"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-bright-5 hover:text-bright-3"
              onClick={() => setIsVisible(!isVisible)}
            >
              {isVisible ? "隐藏" : "显示"}
            </button>
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="w-full poster-button poster-button-primary"
        >
          设置 API 密钥
        </Button>
      </form>
    </div>
  );
};

export default ApiKeyInput;
