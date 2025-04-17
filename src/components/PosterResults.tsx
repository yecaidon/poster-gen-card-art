
import { useState, useEffect } from "react";
import { PosterTaskResult, downloadImage } from "@/services/posterService";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface PosterResultsProps {
  taskResult: PosterTaskResult | null;
  isLoading: boolean;
}

const PosterResults = ({ taskResult, isLoading }: PosterResultsProps) => {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  useEffect(() => {
    // Reset selected images when task result changes
    setSelectedImages([]);
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
    for (let i = 0; i < selectedImages.length; i++) {
      const imageUrl = selectedImages[i];
      const fileName = `poster-${i + 1}-${new Date().getTime()}.jpg`;
      await downloadImage(imageUrl, fileName);
    }

    toast.success(`成功下载 ${selectedImages.length} 张图片`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <div className="loading-spinner mb-4"></div>
        <p className="text-bright-4">正在生成海报，请稍候...</p>
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
          下载选中图片
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {taskResult.render_urls.map((imageUrl, index) => (
          <div 
            key={index} 
            className={`relative rounded-lg overflow-hidden border-2 transition-all duration-200 cursor-pointer
              ${selectedImages.includes(imageUrl) 
                ? 'border-theme-blue shadow-lg shadow-theme-blue/20' 
                : 'border-dark-3 hover:border-dark-1'}`}
            onClick={() => toggleImageSelection(imageUrl)}
          >
            <img 
              src={imageUrl} 
              alt={`海报 ${index + 1}`} 
              className="w-full object-cover aspect-[3/4]" 
            />
            
            {selectedImages.includes(imageUrl) && (
              <div className="absolute top-3 right-3">
                <CheckCircle className="w-6 h-6 text-theme-blue" fill="rgba(29, 58, 255, 0.2)" />
              </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 bg-dark-7/80 py-2 px-3">
              <p className="text-sm text-bright-3">点击选择</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PosterResults;
