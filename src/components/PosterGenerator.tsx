
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
    
    try {
      // Create a task
      const taskResponse = await createPosterTask(params);
      
      // Start polling for the task result
      pollTaskResult(taskResponse.task_id);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(`生成海报失败: ${error instanceof Error ? error.message : "未知错误"}`);
      setIsSubmitting(false);
    }
  };

  const pollTaskResult = async (taskId: string) => {
    try {
      // Get the task result
      const result = await getPosterTaskResult(taskId);
      
      if (result.task_status === "SUCCEEDED") {
        setTaskResult(result);
        setIsSubmitting(false);
        setIsFirstGeneration(false);
        toast.success("海报生成成功");
      } else if (result.task_status === "FAILED") {
        toast.error(`生成海报失败: ${result.message || "任务执行失败"}`);
        setIsSubmitting(false);
      } else {
        // Task is still running, poll again after a delay
        setTimeout(() => pollTaskResult(taskId), 3000);
      }
    } catch (error) {
      console.error("Error polling task result:", error);
      toast.error(`获取海报结果失败: ${error instanceof Error ? error.message : "未知错误"}`);
      setIsSubmitting(false);
    }
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
        />
      </div>
    </div>
  );
};

export default PosterGenerator;
