
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

// Temporary API key storage for demo purposes
// In a production app, this should be handled securely through environment variables
let apiKey = "";

export const setPosterApiKey = (key: string) => {
  apiKey = key;
};

export const getPosterApiKey = () => {
  return apiKey;
};

// Function to create a poster generation task
export const createPosterTask = async (
  params: PosterGenerationParams
): Promise<PosterGenerationResponse> => {
  if (!apiKey) {
    toast.error("API 密钥未设置，请设置 API 密钥后重试");
    throw new Error("API key is not set");
  }

  try {
    // Mock API for development purposes
    // In a real application, this would make a real API call
    console.log("Creating poster task with params:", params);
    
    // Create a mock task ID
    const task_id = `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Return a mock response
    return {
      task_id,
      task_status: "PENDING"
    };
    
    // Commented out real API call code
    /*
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
    */
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
    // Mock API for development purposes
    console.log("Fetching task result for task ID:", taskId);
    
    // Simulate a delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate mock poster URLs
    const mockImages = [
      "https://images.unsplash.com/photo-1541702467897-96929ce23d3d?q=80&w=600&h=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=600&h=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1710876789493-d32bc4aae00d?q=80&w=600&h=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1579546929662-711aa81148cf?q=80&w=600&h=900&auto=format&fit=crop",
    ];
    
    // Return mock results
    return {
      task_id: taskId,
      task_status: "SUCCEEDED",
      render_urls: mockImages.slice(0, Math.floor(Math.random() * 3) + 1),
      auxiliary_parameters: ["mock-aux-param-1", "mock-aux-param-2"],
      bg_urls: mockImages.slice(0, Math.floor(Math.random() * 3) + 1),
      submit_time: new Date().toISOString(),
      scheduled_time: new Date().toISOString(),
      end_time: new Date().toISOString(),
    };
    
    // Commented out real API call code
    /*
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
    */
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
