import { useState, useEffect } from "react";
import { PosterTaskResult, downloadImage } from "@/services/posterService";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle, AlertCircle, RefreshCw, X, ZoomIn } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";

interface PosterResultsProps {
  taskResult: PosterTaskResult | null;
  isLoading: boolean;
  error: string | null;
}

const PosterResults = ({ taskResult, isLoading, error }: PosterResultsProps) => {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({});
  const [allImages, setAllImages] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (taskResult?.render_urls) {
      const initialLoadingState: Record<string, boolean> = {};
      taskResult.render_urls.forEach(url => {
        initialLoadingState[url] = true;
      });
      setLoadingImages(prev => ({ ...prev, ...initialLoadingState }));
      
      setAllImages(prev => {
        const newImages = taskResult.render_urls.filter(url => !prev.includes(url));
        return [...prev, ...newImages];
      });
      
      console.log("Received new image URLs:", taskResult.render_urls);
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

    let successCount = 0;
    let errorCount = 0;
    
    for (const imageUrl of selectedImages) {
      try {
        const fileName = `poster-${Date.now()}-${successCount + errorCount + 1}.jpg`;
        await downloadImage(imageUrl, fileName);
        successCount++;
      } catch (err) {
        console.error("Download error:", err);
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`成功下载 ${successCount} 张图片${errorCount > 0 ? `，${errorCount} 张下载失败` : ''}`);
    } else {
      toast.error("所有图片下载失败，请重试");
    }
  };

  const handleImageLoaded = (imageUrl: string) => {
    console.log("Image loaded successfully:", imageUrl);
    setLoadingImages(prev => ({ ...prev, [imageUrl]: false }));
  };

  const handleImageError = (imageUrl: string) => {
    console.error(`图片加载失败: ${imageUrl}`);
    setImageErrors(prev => ({ ...prev, [imageUrl]: true }));
    setLoadingImages(prev => ({ ...prev, [imageUrl]: false }));
  };

  const retryImageLoad = (imageUrl: string) => {
    setImageErrors(prev => ({ ...prev, [imageUrl]: false }));
    setLoadingImages(prev => ({ ...prev, [imageUrl]: true }));
    
    const timestampedUrl = imageUrl.includes('?') 
      ? `${imageUrl}&t=${Date.now()}` 
      : `${imageUrl}?t=${Date.now()}`;
    
    console.log("Retrying image load with timestamped URL:", timestampedUrl);
    
    const img = new Image();
    img.onload = () => handleImageLoaded(imageUrl);
    img.onerror = () => handleImageError(imageUrl);
    img.src = timestampedUrl;
  };

  const handleImagePreview = (imageUrl: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!imageErrors[imageUrl]) {
      setPreviewImage(imageUrl);
    }
  };

  const handleClosePreview = () => {
    setPreviewImage(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <div className="loading-spinner mb-4"></div>
        <p className="text-bright-4">正在生成海报，请稍候...</p>
      </div>
    );
  }

  if (error && allImages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-bright-4 mb-2">生成海报时出错</p>
        <p className="text-sm text-bright-6 text-center max-w-md">{error}</p>
      </div>
    );
  }

  if (allImages.length === 0) {
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
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-sm text-red-700">
              最新生成遇到错误: {error}
            </p>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {allImages.map((imageUrl, index) => (
          <div 
            key={`${imageUrl}-${index}`}
            className={`relative rounded-lg overflow-hidden border-2 transition-all duration-200 cursor-pointer
              ${selectedImages.includes(imageUrl) 
                ? 'border-theme-blue shadow-lg shadow-theme-blue/20' 
                : 'border-dark-3 hover:border-dark-1'}`}
            onClick={() => !imageErrors[imageUrl] && toggleImageSelection(imageUrl)}
            onDoubleClick={(e) => handleImagePreview(imageUrl, e)}
          >
            {imageErrors[imageUrl] ? (
              <div className={`w-full ${taskResult?.wh_ratios === "16:9" ? "aspect-video" : "aspect-[9/16]"} bg-gray-200 flex flex-col items-center justify-center p-4 text-center`}>
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
              <div className={`relative w-full ${taskResult?.wh_ratios === "16:9" ? "aspect-video" : "aspect-[9/16]"}`}>
                {loadingImages[imageUrl] && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                    <div className="loading-spinner"></div>
                  </div>
                )}
                <img 
                  src={imageUrl} 
                  alt={`海报 ${index + 1}`} 
                  className="w-full h-full object-contain" 
                  onLoad={() => handleImageLoaded(imageUrl)}
                  onError={() => handleImageError(imageUrl)}
                  style={{
                    opacity: loadingImages[imageUrl] ? 0 : 1,
                    transition: 'opacity 0.3s ease'
                  }}
                />
                <div className="absolute top-3 right-3 bg-dark-7/70 rounded-full p-1" 
                  onClick={(e) => {
                    e.stopPropagation(); 
                    handleImagePreview(imageUrl, e);
                  }}
                >
                  <ZoomIn className="w-5 h-5 text-bright-2" />
                </div>
              </div>
            )}
            
            {selectedImages.includes(imageUrl) && !imageErrors[imageUrl] && (
              <div className="absolute top-3 left-3">
                <CheckCircle className="w-6 h-6 text-theme-blue" fill="rgba(29, 58, 255, 0.2)" />
              </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 bg-dark-7/80 py-2 px-3 flex justify-between items-center">
              <p className="text-sm text-bright-3">
                {imageErrors[imageUrl] ? '图片加载失败' : '点击选择，双击预览'}
              </p>
              {!imageErrors[imageUrl] && (
                <p className="text-xs text-bright-5">
                  {selectedImages.includes(imageUrl) ? '已选择' : '未选择'}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={previewImage !== null} onOpenChange={handleClosePreview}>
        <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-dark-8 border-dark-4">
          <DialogClose className="absolute right-3 top-3 z-10 rounded-full bg-dark-7/80 p-1.5 text-bright-5 hover:text-bright-3 focus:outline-none">
            <X className="h-5 w-5" />
            <span className="sr-only">关闭</span>
          </DialogClose>
          
          {previewImage && (
            <div className={`relative w-full ${taskResult?.wh_ratios === "16:9" ? "max-h-[60vh]" : "max-h-[80vh]"} overflow-hidden flex items-center justify-center`}>
              <img 
                src={previewImage} 
                alt="海报预览"
                className="max-w-full h-full object-contain" 
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                <Button 
                  onClick={() => {
                    if (previewImage) {
                      const fileName = `poster-preview-${Date.now()}.jpg`;
                      downloadImage(previewImage, fileName);
                    }
                    handleClosePreview();
                  }}
                  className="poster-button poster-button-primary"
                >
                  <Download className="w-4 h-4 mr-2" />
                  下载此图片
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PosterResults;
