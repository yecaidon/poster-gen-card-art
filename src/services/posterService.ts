
import { toast } from "sonner";

// Types for our poster generation API
export interface PosterGenerationParams {
  title: string;
  sub_title?: string;
  body_text?: string;
  prompt_text_zh?: string;
  prompt_text_en?: string;
  wh_ratios: "横版" | "竖版";
  lora_name?: string;
  lora_weight?: number;
  ctrl_ratio?: number;
  ctrl_step?: number;
  generate_mode: "generate" | "sr" | "hrf";
  generate_num?: number;
  auxiliary_parameters?: string;
}

export interface PosterGenerationResponse {
  task_id: string;
  task_status: "PENDING" | "RUNNING" | "SUSPENDED" | "SUCCEEDED" | "FAILED";
}

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
}

// API key storage
let apiKey = "";

export const setPosterApiKey = (key: string) => {
  apiKey = key;
};

export const getPosterApiKey = () => {
  return apiKey;
};

// Environment detection
const isDevelopment = import.meta.env.DEV;

// Function to create a poster generation task
export const createPosterTask = async (
  params: PosterGenerationParams
): Promise<PosterGenerationResponse> => {
  if (!apiKey) {
    toast.error("API 密钥未设置，请设置 API 密钥后重试");
    throw new Error("API key is not set");
  }

  try {
    console.log("Creating poster task with params:", params);
    
    if (isDevelopment) {
      // Create a mock task ID for development
      const task_id = `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Return a mock response
      return {
        task_id,
        task_status: "PENDING"
      };
    } else {
      // Real API call for production
      const response = await fetch(
        "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis",
        {
          method: "POST",
          headers: {
            "X-DashScope-Async": "enable",
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "wanx-poster-generation-v1",
            input: params,
            parameters: {},
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create poster task");
      }

      const data = await response.json();
      return data.output;
    }
  } catch (error) {
    console.error("Error creating poster task:", error);
    toast.error(`创建海报任务失败: ${error instanceof Error ? error.message : "未知错误"}`);
    throw error;
  }
};

// Function to query the task result
export const getPosterTaskResult = async (
  taskId: string
): Promise<PosterTaskResult> => {
  if (!apiKey) {
    toast.error("API 密钥未设置，请设置 API 密钥后重试");
    throw new Error("API key is not set");
  }

  try {
    console.log("Fetching task result for task ID:", taskId);
    
    if (isDevelopment) {
      // Simulate a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // More realistic mock poster images for development
      const mockImages = [
        "public/lovable-uploads/68774201-56a6-4560-8d5b-e4169087d914.png",
        "https://mdn.alipayobjects.com/huamei_rcfvwt/afts/img/A*U3IxS6d_gAMAAAAAAAAAAAAADtmcAQ/fmt.webp",
        "https://mdn.alipayobjects.com/huamei_rcfvwt/afts/img/A*QHM8RI_TIxMAAAAAAAAAAAAADtmcAQ/fmt.webp",
        "https://mdn.alipayobjects.com/huamei_rcfvwt/afts/img/A*HkP0SpPpxycAAAAAAAAAAAAADtmcAQ/fmt.webp",
      ];
      
      // Number of images to return based on generate_num
      const numImages = Math.min(4, Math.max(1, Math.floor(Math.random() * 4) + 1));
      
      // Return mock results
      return {
        task_id: taskId,
        task_status: "SUCCEEDED",
        render_urls: mockImages.slice(0, numImages),
        auxiliary_parameters: Array(numImages).fill("mock-aux-param"),
        bg_urls: mockImages.slice(0, numImages),
        submit_time: new Date().toISOString(),
        scheduled_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
      };
    } else {
      // Real API call for production
      const response = await fetch(
        `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to get poster task result");
      }

      const data = await response.json();
      return data.output;
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
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading image:", error);
    toast.error(`下载图片失败: ${error instanceof Error ? error.message : "未知错误"}`);
  }
};
