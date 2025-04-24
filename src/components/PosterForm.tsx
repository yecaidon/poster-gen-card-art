import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { PosterGenerationParams } from "@/services/posterService";
import { RefreshCcw } from "lucide-react";

interface PosterFormProps {
  onSubmit: (params: PosterGenerationParams) => void;
  isSubmitting: boolean;
  isFirstGeneration: boolean;
}

const LORA_STYLES = [
  { value: "none", label: "无风格" },
  { value: "2D插画1", label: "2D插画1" },
  { value: "2D插画2", label: "2D插画2" },
  { value: "浩瀚星云", label: "浩瀚星云" },
  { value: "浓郁色彩", label: "浓郁色彩" },
  { value: "光线粒子", label: "光线粒子" },
  { value: "透明玻璃", label: "透明玻璃" },
  { value: "剪纸工艺", label: "剪纸工艺" },
  { value: "折纸工艺", label: "折纸工艺" },
  { value: "中国水墨", label: "中国水墨" },
  { value: "中国刺绣", label: "中国刺绣" },
  { value: "真实场景", label: "真实场景" },
  { value: "2D卡通", label: "2D卡通" },
  { value: "儿童水彩", label: "儿童水彩" },
  { value: "赛博背景", label: "赛博背景" },
  { value: "浅蓝抽象", label: "浅蓝抽象" },
  { value: "深蓝抽象", label: "深蓝抽象" },
  { value: "抽象点线", label: "抽象点线" },
  { value: "童话油画", label: "童话油画" },
];

const PosterForm = ({ onSubmit, isSubmitting, isFirstGeneration }: PosterFormProps) => {
  const [formState, setFormState] = useState<PosterGenerationParams>({
    title: "春节快乐",
    sub_title: "家庭团聚，共享天伦之乐",
    body_text: "春节是中国最重要的传统节日之一，它象征着新的开始和希望",
    prompt_text_zh: "灯笼，小猫，梅花",
    wh_ratios: "9:16",
    lora_name: "童话油画",
    lora_weight: 0.8,
    ctrl_ratio: 0.7,
    ctrl_step: 0.7,
    generate_mode: "generate",
    generate_num: 2,
  });

  const handleChange = (field: keyof PosterGenerationParams, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalParams = {...formState};
    
    if (finalParams.lora_name === "none") {
      finalParams.lora_name = undefined;
    }
    
    onSubmit(finalParams);
  };

  const isFormValid = !!formState.title;

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-10">
      <div className="space-y-2">
        <Label htmlFor="title" className="form-label">主标题 (必填)</Label>
        <Input
          id="title"
          value={formState.title}
          onChange={e => handleChange("title", e.target.value)}
          placeholder="输入主标题，最多30个字符"
          maxLength={30}
          className="bg-dark-3 border-dark-1"
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sub_title" className="form-label">副标题</Label>
        <Input
          id="sub_title"
          value={formState.sub_title}
          onChange={e => handleChange("sub_title", e.target.value)}
          placeholder="输入副标题，最多30个字符"
          maxLength={30}
          className="bg-dark-3 border-dark-1"
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="body_text" className="form-label">正文内容</Label>
        <Textarea
          id="body_text"
          value={formState.body_text}
          onChange={e => handleChange("body_text", e.target.value)}
          placeholder="输入正文内容，最多50个字符"
          maxLength={50}
          className="bg-dark-3 border-dark-1 resize-none h-20"
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="prompt_text_zh" className="form-label">中文提示词</Label>
        <Textarea
          id="prompt_text_zh"
          value={formState.prompt_text_zh}
          onChange={e => handleChange("prompt_text_zh", e.target.value)}
          placeholder="输入中文提示词，描述你想要的图像元素"
          maxLength={50}
          className="bg-dark-3 border-dark-1 resize-none h-20"
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="prompt_text_en" className="form-label">英文提示词 (可选)</Label>
        <Textarea
          id="prompt_text_en"
          value={formState.prompt_text_en}
          onChange={e => handleChange("prompt_text_en", e.target.value)}
          placeholder="输入英文提示词（可选）"
          maxLength={50}
          className="bg-dark-3 border-dark-1 resize-none h-20"
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="wh_ratios" className="form-label">海报版式</Label>
        <Select
          value={formState.wh_ratios}
          onValueChange={value => handleChange("wh_ratios", value)}
          disabled={isSubmitting}
        >
          <SelectTrigger className="bg-dark-3 border-dark-1">
            <SelectValue placeholder="选择海报版式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="16:9">横版 (16:9)</SelectItem>
            <SelectItem value="9:16">竖版 (9:16)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="lora_name" className="form-label">海报风格</Label>
        <Select
          value={formState.lora_name || "none"}
          onValueChange={value => handleChange("lora_name", value === "none" ? undefined : value)}
          disabled={isSubmitting}
        >
          <SelectTrigger className="bg-dark-3 border-dark-1">
            <SelectValue placeholder="选择海报风格" />
          </SelectTrigger>
          <SelectContent>
            {LORA_STYLES.map(style => (
              <SelectItem key={style.value} value={style.value}>
                {style.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="lora_weight" className="form-label">风格权重</Label>
          <span className="text-xs text-bright-5">{formState.lora_weight?.toFixed(1) || "0.8"}</span>
        </div>
        <Slider
          id="lora_weight"
          min={0}
          max={1}
          step={0.1}
          value={[formState.lora_weight || 0.8]}
          onValueChange={value => handleChange("lora_weight", value[0])}
          disabled={isSubmitting}
          className="my-5"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="ctrl_ratio" className="form-label">留白效果权重</Label>
          <span className="text-xs text-bright-5">{formState.ctrl_ratio?.toFixed(1) || "0.7"}</span>
        </div>
        <Slider
          id="ctrl_ratio"
          min={0}
          max={1}
          step={0.1}
          value={[formState.ctrl_ratio || 0.7]}
          onValueChange={value => handleChange("ctrl_ratio", value[0])}
          disabled={isSubmitting}
          className="my-5"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="ctrl_step" className="form-label">留白步数比例</Label>
          <span className="text-xs text-bright-5">{formState.ctrl_step?.toFixed(1) || "0.7"}</span>
        </div>
        <Slider
          id="ctrl_step"
          min={0.1}
          max={1}
          step={0.1}
          value={[formState.ctrl_step || 0.7]}
          onValueChange={value => handleChange("ctrl_step", value[0])}
          disabled={isSubmitting}
          className="my-5"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="generate_num" className="form-label">生成数量</Label>
        <Select
          value={formState.generate_num?.toString() || "2"}
          onValueChange={value => handleChange("generate_num", parseInt(value))}
          disabled={isSubmitting}
        >
          <SelectTrigger className="bg-dark-3 border-dark-1">
            <SelectValue placeholder="选择生成数量" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1张</SelectItem>
            <SelectItem value="2">2张</SelectItem>
            <SelectItem value="3">3张</SelectItem>
            <SelectItem value="4">4张</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        type="submit"
        disabled={!isFormValid || isSubmitting}
        className="poster-button poster-button-primary w-full h-10 mt-8"
      >
        {isSubmitting ? (
          <>
            <span className="loading-spinner w-5 h-5"></span>
            <span>正在生成...</span>
          </>
        ) : (
          <>
            {isFirstGeneration ? "开始生成" : (
              <>
                <RefreshCcw className="w-4 h-4 mr-2" />
                <span>继续生成</span>
              </>
            )}
          </>
        )}
      </Button>
    </form>
  );
};

export default PosterForm;
