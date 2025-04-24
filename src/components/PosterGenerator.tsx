import { useState, useEffect } from "react";
import PosterForm from "./PosterForm";
import PosterResults from "./PosterResults";
import ApiKeyInput from "./ApiKeyInput";
import { 
  createPosterTask, 
  getPosterTaskResult, 
  PosterGenerationParams, 
  PosterTaskResult,
  getPosterApiKey
} from "@/services/posterService";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const PosterGenerator = () => {
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskResult, setTaskResult] = useState<PosterTaskResult | null>(null);
  const [isFirstGeneration, setIsFirstGeneration] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectivityError, setConnectivityError] = useState<string | null>(null);
  const [pollingId, setPollingId] = useState<number | null>(null);

  useEffect(() => {
    const apiKey = getPosterApiKey();
    if (apiKey) {
      setIsApiKeySet(true);
    }

    checkConnectivity();
    
    return () => {
      if (pollingId !== null) {
        clearTimeout(pollingId);
      }
    };
  }, [pollingId]);

  const checkConnectivity = async () => {
    try {
      const testUrl = "https://mdn.alipayobjects.com/huamei_rcfvwt/afts/img/A*NZuwQp_vcH0AAAAAAAAAAAAADtmcAQ/fmt.webp";
      await fetch(testUrl, { method: 'HEAD', mode: 'no-cors' });
      
      setConnectivityError(null);
    } catch (err) {
      console.error("Connectivity test failed:", err);
      setConnectivityError("检测到外部资源加载问题，可能影响海报展示。请确保您的网络可以访问阿里云资源。");
    }
  };

  const handleApiKeySet = () => {
    setIsApiKeySet(true);
  };

  const handleSubmit = async (params: PosterGenerationParams) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log("Submitting poster generation with params:", params);
      
      const taskResponse = await createPosterTask(params);
      
      if (taskResponse.task_id) {
        console.log("Task created successfully with ID:", taskResponse.task_id);
        pollTaskResult(taskResponse.task_id, params.wh_ratios);
      } else {
        throw new Error("未获取到任务ID");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(`生成海报失败: ${error instanceof Error ? error.message : "未知错误"}`);
      setIsSubmitting(false);
      setError(error instanceof Error ? error.message : "未知错误");
    }
  };

  const pollTaskResult = async (taskId: string, whRatios: "16:9" | "9:16") => {
    let retryCount = 0;
    const maxRetries = 30;
    const pollInterval = 3000;
    
    const poll = async () => {
      if (retryCount >= maxRetries) {
        toast.error("获取海报结果超时，请重试");
        setIsSubmitting(false);
        setError("获取海报结果超时");
        return;
      }
      
      try {
        console.log(`Polling task result (attempt ${retryCount + 1}/${maxRetries})`);
        
        const result = await getPosterTaskResult(taskId);
        
        console.log("Task result:", result);
        
        if (result.task_status === "SUCCEEDED") {
          if (result.render_urls && result.render_urls.length > 0) {
            const resultWithRatios = {
              ...result,
              wh_ratios: whRatios
            };
            setTaskResult(resultWithRatios);
            setIsSubmitting(false);
            setIsFirstGeneration(false);
            toast.success("海报生成成功");
          } else {
            throw new Error("没有返回图片数据");
          }
        } else if (result.task_status === "FAILED") {
          toast.error(`生成海报失败: ${result.message || "任务执行失败"}`);
          setIsSubmitting(false);
          setError(result.message || "任务执行失败");
        } else if (["PENDING", "RUNNING", "SUSPENDED"].includes(result.task_status)) {
          console.log(`Task is still ${result.task_status}, polling again in ${pollInterval}ms`);
          retryCount++;
          const timeoutId = setTimeout(poll, pollInterval);
          setPollingId(Number(timeoutId));
        } else {
          toast.error(`生成海报失败: 未预期的任务状态 ${result.task_status}`);
          setIsSubmitting(false);
          setError(`未预期的任务状态: ${result.task_status}`);
        }
      } catch (error) {
        console.error("Error polling task result:", error);
        
        if (retryCount < 3) {
          retryCount++;
          const timeoutId = setTimeout(poll, pollInterval);
          setPollingId(Number(timeoutId));
        } else {
          toast.error(`获取海报结果失败: ${error instanceof Error ? error.message : "未知错误"}`);
          setIsSubmitting(false);
          setError(error instanceof Error ? error.message : "未知错误");
        }
      }
    };
    
    poll();
  };

  if (!isApiKeySet) {
    return <ApiKeyInput onApiKeySet={handleApiKeySet} />;
  }

  return (
    <div className="split-panel">
      <div className="form-panel">
        <h1 className="text-2xl font-bold mb-6">AI 海报生成器</h1>
        {connectivityError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{connectivityError}</AlertDescription>
          </Alert>
        )}
        
        <PosterForm 
          onSubmit={handleSubmit} 
          isSubmitting={isSubmitting}
          isFirstGeneration={isFirstGeneration}
        />
      </div>
      <div className="result-panel">
        <PosterResults 
          taskResult={taskResult} 
          isLoading={isSubmitting} 
          error={error}
        />
      </div>
    </div>
  );
};

export default PosterGenerator;
