
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

const PosterGenerator = () => {
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskResult, setTaskResult] = useState<PosterTaskResult | null>(null);
  const [isFirstGeneration, setIsFirstGeneration] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if API key is already set
    const apiKey = getPosterApiKey();
    if (apiKey) {
      setIsApiKeySet(true);
    }
  }, []);

  const handleApiKeySet = () => {
    setIsApiKeySet(true);
  };

  const handleSubmit = async (params: PosterGenerationParams) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Create a task
      const taskResponse = await createPosterTask(params);
      
      if (taskResponse.task_id) {
        // Start polling for the task result
        pollTaskResult(taskResponse.task_id);
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

  const pollTaskResult = async (taskId: string) => {
    let retryCount = 0;
    const maxRetries = 10;
    const pollInterval = 3000; // 3 seconds
    
    const poll = async () => {
      try {
        // Get the task result
        const result = await getPosterTaskResult(taskId);
        
        if (result.task_status === "SUCCEEDED") {
          if (result.render_urls && result.render_urls.length > 0) {
            setTaskResult(result);
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
        } else if (["PENDING", "RUNNING"].includes(result.task_status)) {
          // Task is still running, poll again after a delay if we haven't exceeded max retries
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(poll, pollInterval);
          } else {
            toast.error("获取海报结果超时，请重试");
            setIsSubmitting(false);
            setError("获取海报结果超时");
          }
        } else {
          // Handle unexpected status
          toast.error(`生成海报失败: 未预期的任务状态 ${result.task_status}`);
          setIsSubmitting(false);
          setError(`未预期的任务状态: ${result.task_status}`);
        }
      } catch (error) {
        console.error("Error polling task result:", error);
        toast.error(`获取海报结果失败: ${error instanceof Error ? error.message : "未知错误"}`);
        setIsSubmitting(false);
        setError(error instanceof Error ? error.message : "未知错误");
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
