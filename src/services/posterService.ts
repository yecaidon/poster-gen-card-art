
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

// Function to create a poster generation task based on Alibaba Cloud API
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
      console.log("Development mode: Created mock task ID:", task_id);
      
      // Return a mock response
      return {
        task_id,
        task_status: "PENDING"
      };
    } else {
      // Real API call to Alibaba Cloud for production
      // This follows the example curl request format exactly
      console.log("Production mode: Calling Alibaba Cloud API");
      
      const requestBody = {
        model: "wanx-poster-generation-v1",
        input: params,
        parameters: {}
      };
      
      console.log("API Request body:", JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(
        "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis",
        {
          method: "POST",
          headers: {
            "X-DashScope-Async": "enable",
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        console.error("API error response:", errorData);
        throw new Error(errorData.message || `请求失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      // Log the complete API response for debugging
      console.log("API response:", JSON.stringify(data, null, 2));
      
      if (data.output?.task_id) {
        return {
          task_id: data.output.task_id,
          task_status: data.output.task_status || "PENDING"
        };
      } else if (data.task_id) {
        // Alternative response format
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

// Function to query the task result based on Alibaba Cloud API
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
      
      // Use reliable local images that won't fail to load
      const mockImages = [
        "/lovable-uploads/a2db5cbb-2a6a-4eba-90ca-520fec9edaac.png", 
      ];
      
      console.log("Development mode: Returning mock poster results");
      
      // Return mock results
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
      // Real API call for production - exactly following the example
      console.log("Production mode: Calling Alibaba Cloud API to check task status");
      
      const response = await fetch(
        `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        console.error("API error response:", errorData);
        throw new Error(errorData.message || `请求失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Task result API response:", JSON.stringify(data, null, 2));
      
      // Extract the output object according to the API documentation
      if (data.output) {
        return data.output;
      } else if (data.task_status) {
        // Alternative response format - direct in response root
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
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link); // This is important for Firefox
      link.click();
      document.body.removeChild(link); // Clean up
      window.URL.revokeObjectURL(url);
      return;
    }
    
    // Regular image download procedure for remote URLs
    const response = await fetch(imageUrl, { 
      mode: 'cors',
      cache: 'no-cache',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link); // This is important for Firefox
    link.click();
    document.body.removeChild(link); // Clean up
    window.URL.revokeObjectURL(url);
    
    toast.success(`图片 ${fileName} 下载成功`);
  } catch (error) {
    console.error("Error downloading image:", error);
    toast.error(`下载图片失败: ${error instanceof Error ? error.message : "未知错误"}`);
    throw error;
  }
};
