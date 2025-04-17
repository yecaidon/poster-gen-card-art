
import { useState, useEffect } from "react";
import { PosterTaskResult, downloadImage } from "@/services/posterService";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface PosterResultsProps {
  taskResult: PosterTaskResult | null;
  isLoading: boolean;
  error: string | null;
}

const PosterResults = ({ taskResult, isLoading, error }: PosterResultsProps) => {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Reset selected images when task result changes
    setSelectedImages([]);
    setImageErrors({});
    setLoadingImages({});
    
    // Set initial loading state for all images
    if (taskResult?.render_urls) {
      const initialLoadingState: Record<string, boolean> = {};
      taskResult.render_urls.forEach(url => {
        initialLoadingState[url] = true;
      });
      setLoadingImages(initialLoadingState);
      
      // Log the image URLs for debugging
      console.log("Received image URLs:", taskResult.render_urls);
    }
  }, [taskResult]);

  const toggleImageSelection = (imageUrl: string) => {
    setSelectedImages(prevSelected => {
      if (prevSelected.includes(imageUrl)) {
        return prevSelected.filter(url => url !== imageUrl);
      } else {
        return [...prevSelected, imageUrl];
      }
    });
  };

  const handleDownload = async () => {
    if (selectedImages.length === 0) {
      toast.error("请至少选择一张图片");
      return;
    }

    // Download all selected images
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < selectedImages.length; i++) {
      try {
        const imageUrl = selectedImages[i];
        const fileName = `poster-${i + 1}-${new Date().getTime()}.jpg`;
        await downloadImage(imageUrl, fileName);
        successCount++;
      } catch (err) {
        console.error("Download error:", err);
        errorCount++;
        // Continue with other downloads even if one fails
      }
    }

    if (successCount > 0) {
      toast.success(`成功下载 ${successCount} 张图片${errorCount > 0 ? `，${errorCount} 张下载失败` : ''}`);
    } else {
      toast.error("所有图片下载失败，请重试");
    }
  };

  // Function to handle image load completion
  const handleImageLoaded = (imageUrl: string) => {
    console.log("Image loaded successfully:", imageUrl);
    setLoadingImages(prev => ({ ...prev, [imageUrl]: false }));
  };

  // Function to handle image errors
  const handleImageError = (imageUrl: string) => {
    console.error(`图片加载失败: ${imageUrl}`);
    setImageErrors(prev => ({ ...prev, [imageUrl]: true }));
    setLoadingImages(prev => ({ ...prev, [imageUrl]: false }));
  };

  // Function to retry loading an image
  const retryImageLoad = (imageUrl: string) => {
    setImageErrors(prev => ({ ...prev, [imageUrl]: false }));
    setLoadingImages(prev => ({ ...prev, [imageUrl]: true }));
    
    // Force browser to reload the image by appending a timestamp
    const timestampedUrl = imageUrl.includes('?') 
      ? `${imageUrl}&t=${Date.now()}` 
      : `${imageUrl}?t=${Date.now()}`;
    
    console.log("Retrying image load with timestamped URL:", timestampedUrl);
    
    const img = new Image();
    img.onload = () => handleImageLoaded(imageUrl);
    img.onerror = () => handleImageError(imageUrl);
    img.src = timestampedUrl;
  };

  // Local fallback image that's guaranteed to exist
  const fallbackImage = "/lovable-uploads/a2db5cbb-2a6a-4eba-90ca-520fec9edaac.png";

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <div className="loading-spinner mb-4"></div>
        <p className="text-bright-4">正在生成海报，请稍候...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-bright-4 mb-2">生成海报时出错</p>
        <p className="text-sm text-bright-6 text-center max-w-md">{error}</p>
      </div>
    );
  }

  if (!taskResult?.render_urls || taskResult.render_urls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <p className="text-bright-4 mb-2">尚未生成海报</p>
        <p className="text-sm text-bright-6">请填写表单并点击生成按钮开始创建</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">生成结果</h2>
        <Button 
          onClick={handleDownload}
          disabled={selectedImages.length === 0}
          className="poster-button poster-button-primary"
        >
          <Download className="w-4 h-4 mr-2" />
          下载选中图片 ({selectedImages.length})
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {taskResult.render_urls.map((imageUrl, index) => (
          <div 
            key={`${imageUrl}-${index}`}
            className={`relative rounded-lg overflow-hidden border-2 transition-all duration-200 cursor-pointer
              ${selectedImages.includes(imageUrl) 
                ? 'border-theme-blue shadow-lg shadow-theme-blue/20' 
                : 'border-dark-3 hover:border-dark-1'}`}
            onClick={() => !imageErrors[imageUrl] && toggleImageSelection(imageUrl)}
          >
            {/* Use a more reliable image display approach with error handling */}
            {imageErrors[imageUrl] ? (
              <div className="w-full aspect-[3/4] bg-gray-200 flex flex-col items-center justify-center p-4 text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                <p className="text-sm text-gray-600">图片加载失败</p>
                <Button 
                  variant="outline" 
                  className="mt-3"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    retryImageLoad(imageUrl);
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  重试
                </Button>
              </div>
            ) : (
              <div className="relative w-full aspect-[3/4]">
                {loadingImages[imageUrl] && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                    <div className="loading-spinner"></div>
                  </div>
                )}
                <img 
                  src={imageUrl} 
                  alt={`海报 ${index + 1}`} 
                  className="w-full h-full object-cover" 
                  onLoad={() => handleImageLoaded(imageUrl)}
                  onError={() => handleImageError(imageUrl)}
                  style={{
                    opacity: loadingImages[imageUrl] ? 0 : 1,
                    transition: 'opacity 0.3s ease'
                  }}
                />
              </div>
            )}
            
            {selectedImages.includes(imageUrl) && !imageErrors[imageUrl] && (
              <div className="absolute top-3 right-3">
                <CheckCircle className="w-6 h-6 text-theme-blue" fill="rgba(29, 58, 255, 0.2)" />
              </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 bg-dark-7/80 py-2 px-3 flex justify-between items-center">
              <p className="text-sm text-bright-3">
                {imageErrors[imageUrl] ? '图片加载失败' : '点击选择'}
              </p>
              {/* Show selection status */}
              {!imageErrors[imageUrl] && (
                <p className="text-xs text-bright-5">
                  {selectedImages.includes(imageUrl) ? '已选择' : '未选择'}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PosterResults;
