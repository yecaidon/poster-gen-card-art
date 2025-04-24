import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Types for our poster generation API
export interface PosterGenerationParams {
  title: string;
  sub_title?: string;
  body_text?: string;
  prompt_text_zh?: string;
  prompt_text_en?: string;
  wh_ratios: "16:9" | "9:16";  // This is what we use in the UI
  lora_name?: string;
  lora_weight?: number;
  ctrl_ratio?: number;
  ctrl_step?: number;
  generate_mode: "generate" | "sr" | "hrf";
  generate_num?: number;
  auxiliary_parameters?: string;
}

// API response interface
export interface PosterTaskResult {
  task_id: string;
  task_status: "PENDING" | "RUNNING" | "SUSPENDED" | "SUCCEEDED" | "FAILED";
  render_urls?: string[];
  auxiliary_parameters?: string[];
  bg_urls?: string[];
  submit_time?: string;
  scheduled_time?: string;
  end_time?: string;
  code?: string;
  message?: string;
  wh_ratios?: "16:9" | "9:16";  // Added this property to match what's used in the component
}

// Helper function to convert UI aspect ratio to API expected value
const convertAspectRatio = (uiRatio: "16:9" | "9:16"): "横版" | "竖版" => {
  return uiRatio === "16:9" ? "横版" : "竖版";
};

// API key storage
let apiKey = "";

export const setPosterApiKey = (key: string) => {
  apiKey = key;
  // Also store in localStorage for persistence
  try {
    localStorage.setItem("posterApiKey", key);
  } catch (error) {
    console.error("Failed to store API key in localStorage:", error);
  }
};

export const getPosterApiKey = () => {
  // Try to retrieve from localStorage if not in memory
  if (!apiKey) {
    try {
      const storedKey = localStorage.getItem("posterApiKey");
      if (storedKey) {
        apiKey = storedKey;
      }
    } catch (error) {
      console.error("Failed to retrieve API key from localStorage:", error);
    }
  }
  return apiKey;
};

// Environment detection
const isDevelopment = import.meta.env.DEV;

// Function to create a poster generation task using our Supabase Edge Function
export const createPosterTask = async (
  params: PosterGenerationParams
): Promise<PosterTaskResult> => {
  if (!apiKey) {
    toast.error("API 密钥未设置，请设置 API 密钥后重试");
    throw new Error("API key is not set");
  }

  try {
    console.log("Creating poster task with params:", params);
    
    // Convert our UI aspect ratio to what the API expects
    const apiParams = {
      ...params,
      wh_ratios: convertAspectRatio(params.wh_ratios)
    };
    
    console.log("Converted API params:", apiParams);
    
    if (isDevelopment) {
      // Create a mock task ID for development
      const task_id = `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      console.log("Development mode: Created mock task ID:", task_id);
      
      // Return a mock response
      return {
        task_id,
        task_status: "PENDING"
      };
    } else {
      // Call our Supabase Edge Function
      console.log("Production mode: Calling Edge Function to create poster task");
      
      const { data, error } = await supabase.functions.invoke('poster-generation', {
        body: {
          apiKey,
          params: apiParams // Use converted params
        }
      });
      
      console.log("Edge Function response:", data);
      
      if (error) {
        console.error("Edge Function error:", error);
        throw new Error(`Edge Function error: ${error.message}`);
      }
      
      if (!data) {
        throw new Error("No data returned from Edge Function");
      }
      
      // Extract task ID and status from the response
      if (data.output?.task_id) {
        return {
          task_id: data.output.task_id,
          task_status: data.output.task_status || "PENDING"
        };
      } else if (data.task_id) {
        return {
          task_id: data.task_id,
          task_status: data.task_status || "PENDING"
        };
      } else {
        throw new Error("API 响应中缺少任务 ID");
      }
    }
  } catch (error) {
    console.error("Error creating poster task:", error);
    toast.error(`创建海报任务失败: ${error instanceof Error ? error.message : "未知错误"}`);
    throw error;
  }
};

// Function to query the task result using our Supabase Edge Function
export const getPosterTaskResult = async (
  taskId: string
): Promise<PosterTaskResult> => {
  if (!apiKey) {
    toast.error("API 密钥未设置，请设置 API 密钥后重试");
    throw new Error("API key is not set");
  }

  try {
    console.log("Fetching task result for task ID:", taskId);
    
    // 检查是否为模拟或回退的任务ID
    if (isDevelopment || taskId.startsWith('mock-') || taskId.startsWith('cors-fallback-')) {
      // 如果是开发模式或模拟/回退任务ID，立即返回模拟数据
      console.log("使用模拟数据为任务:", taskId);
      
      // 模拟延迟以模拟真实API行为
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 使用可靠的本地图片
      const mockImages = [
        "/lovable-uploads/a2db5cbb-2a6a-4eba-90ca-520fec9edaac.png", 
      ];
      
      console.log("返回模拟海报结果");
      
      // 返回模拟结果
      return {
        task_id: taskId,
        task_status: "SUCCEEDED",
        render_urls: mockImages,
        auxiliary_parameters: ["mock-aux-param"],
        bg_urls: mockImages,
        submit_time: new Date().toISOString(),
        scheduled_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
      };
    } else {
      // Call our Supabase Edge Function to get task result
      console.log("Production mode: Calling Edge Function to get task result");
      
      const { data, error } = await supabase.functions.invoke('poster-task-result', {
        body: {
          apiKey,
          taskId
        }
      });
      
      console.log("Edge Function response:", data);
      
      if (error) {
        console.error("Edge Function error:", error);
        throw new Error(`Edge Function error: ${error.message}`);
      }
      
      if (!data) {
        throw new Error("No data returned from Edge Function");
      }
      
      // Process the response data
      if (data.output) {
        return data.output;
      } else if (data.task_status) {
        // Alternative response format - directly in response root
        return data;
      } else {
        throw new Error("API 响应中缺少输出数据");
      }
    }
  } catch (error) {
    console.error("Error getting poster task result:", error);
    toast.error(`获取海报任务结果失败: ${error instanceof Error ? error.message : "未知错误"}`);
    throw error;
  }
};

// Function to download an image
export const downloadImage = async (imageUrl: string, fileName: string) => {
  try {
    console.log("Downloading image:", imageUrl);
    
    // Special handling for local development resources
    if (imageUrl.startsWith('/')) {
      console.log("Local resource detected");
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const blob = await response.blob();
      triggerDownload(blob, fileName);
      return;
    }
    
    // For non-local images, use our proxy edge function
    console.log("Using proxy to download image");
    
    const { data, error } = await supabase.functions.invoke('poster-image-proxy', {
      body: { imageUrl }
    });
    
    if (error) {
      console.error("Edge function error:", error);
      throw new Error(`代理服务器错误: ${error.message}`);
    }

    // Convert response to Blob
    const blob = new Blob([data], { type: 'image/png' });
    if (blob.size === 0) {
      throw new Error("Downloaded image is empty");
    }

    // Trigger the download
    triggerDownload(blob, fileName);
    toast.success(`图片 ${fileName} 下载成功`);

  } catch (error) {
    console.error("Error downloading image:", error);
    toast.error(`下载图片失败: ${error instanceof Error ? error.message : "未知错误"}`);
    throw error;
  }
};

// Helper function to trigger the download
const triggerDownload = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
