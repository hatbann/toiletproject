// Supabase Storage 이미지 업로드 서비스
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ Supabase 환경 변수가 설정되지 않았습니다.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'toilets';

/**
 * 이미지를 Supabase Storage에 업로드하고 URL을 반환합니다.
 * @param file - 업로드할 파일 (Express.Multer.File)
 * @param folder - Storage 내 저장할 폴더 경로 (예: 'toilets')
 * @returns 업로드된 이미지의 공개 URL
 */
export async function uploadImageToSupabase(
  file: Express.Multer.File,
  folder: string = 'toilets'
): Promise<string> {
  try {
    // 파일 확장자 추출
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
    
    // 고유한 파일명 생성 (UUID + 타임스탬프)
    const fileName = `${folder}/${uuidv4()}-${Date.now()}.${fileExtension}`;
    
    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false, // 기존 파일 덮어쓰기 방지
      });

    if (error) {
      console.error('❌ Supabase Storage 업로드 실패:', error);
      throw new Error(`이미지 업로드에 실패했습니다: ${error.message}`);
    }

    // 공개 URL 가져오기
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    const imageUrl = urlData.publicUrl;
    
    console.log(`✅ 이미지 업로드 성공: ${imageUrl}`);
    return imageUrl;
  } catch (error) {
    console.error('❌ Supabase 이미지 업로드 실패:', error);
    throw new Error('이미지 업로드에 실패했습니다.');
  }
}

/**
 * 여러 이미지를 Supabase Storage에 업로드하고 URL 배열을 반환합니다.
 * @param files - 업로드할 파일 배열
 * @param folder - Storage 내 저장할 폴더 경로
 * @returns 업로드된 이미지 URL 배열
 */
export async function uploadMultipleImagesToSupabase(
  files: Express.Multer.File[],
  folder: string = 'toilets'
): Promise<string[]> {
  try {
    const uploadPromises = files.map(file => uploadImageToSupabase(file, folder));
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    console.error('❌ 여러 이미지 업로드 실패:', error);
    throw new Error('이미지 업로드에 실패했습니다.');
  }
}

