"use client";

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 pt-8">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link to="/register">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              회원가입으로 돌아가기
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Peeple 이용약관</CardTitle>
            <p className="text-sm text-gray-600">
              위치 기반 화장실 안내 서비스 이용약관
            </p>
          </CardHeader>
          
          <CardContent className="prose max-w-none">
            <div className="space-y-6 text-sm leading-relaxed">
              
              <section>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  제1조 (목적)
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">
                    본 약관은 Peeple(이하 "회사")가 제공하는 위치 기반 화장실 안내 서비스(이하 "서비스")의 이용과 관련하여 회사와 회원 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  제2조 (정의)
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-gray-700">
                    1. "서비스"란 회원이 위치 정보를 기반으로 근처 화장실을 검색·이용·등록할 수 있도록 회사가 제공하는 웹사이트 및 관련 제반 서비스를 의미합니다.
                  </p>
                  <p className="text-gray-700">
                    2. "회원"이란 본 약관에 동의하고 회사에 이메일을 제공하여 회원가입을 완료한 자를 의미합니다.
                  </p>
                  <p className="text-gray-700">
                    3. "공공 화장실"이란 공공기관에서 제공하는 API를 통해 수집·제공되는 화장실 정보를 의미합니다.
                  </p>
                  <p className="text-gray-700">
                    4. "사용자 등록 화장실"이란 회원이 직접 등록한 화장실 정보를 의미합니다.
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  제3조 (약관의 효력 및 변경)
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-gray-700">
                    1. 본 약관은 회원이 동의함으로써 효력이 발생합니다.
                  </p>
                  <p className="text-gray-700">
                    2. 회사는 필요한 경우 관련 법령을 위반하지 않는 범위에서 본 약관을 변경할 수 있습니다.
                  </p>
                  <p className="text-gray-700">
                    3. 변경된 약관은 서비스 화면에 공지하며, 회원이 변경된 약관에 동의하지 않을 경우 회원 탈퇴를 요청할 수 있습니다.
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  제4조 (회원가입 및 계정 관리)
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-gray-700">
                    1. 회원가입은 이메일 주소를 제공하고 약관에 동의함으로써 완료됩니다.
                  </p>
                  <p className="text-gray-700">
                    2. 회원은 본인의 계정을 타인에게 양도, 대여, 공유할 수 없습니다.
                  </p>
                  <p className="text-gray-700">
                    3. 회원은 가입 시 제공한 정보가 정확하고 최신 상태로 유지되도록 관리해야 합니다.
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  제5조 (서비스의 제공 및 변경)
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-gray-700">
                    1. 회사는 회원에게 위치 기반 화장실 안내, 화장실 정보 등록, 별점·리뷰 작성 등의 기능을 제공합니다.
                  </p>
                  <p className="text-gray-700">
                    2. 회사는 서비스의 일부 또는 전부를 변경하거나 중단할 수 있으며, 이 경우 회원에게 사전 공지합니다.
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  제6조 (회원의 의무)
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 mb-2">회원은 다음 행위를 해서는 안 됩니다.</p>
                  <div className="space-y-1 ml-4">
                    <p className="text-gray-700">1. 허위 또는 부정확한 화장실 정보 등록</p>
                    <p className="text-gray-700">2. 욕설, 비방, 음란물 등 부적절한 리뷰 게시</p>
                    <p className="text-gray-700">3. 타인의 개인정보 무단 수집 및 침해 행위</p>
                    <p className="text-gray-700">4. 서비스의 정상적인 운영을 방해하는 행위</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  제7조 (위치정보의 이용)
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-gray-700">
                    1. 회사는 회원의 동의 하에 위치 정보를 수집·이용하여 근처 화장실 안내 서비스를 제공합니다.
                  </p>
                  <p className="text-gray-700">
                    2. 위치 정보는 서비스 제공 목적 외의 용도로 사용하지 않습니다.
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  제8조 (저작권 및 이용제한)
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-gray-700">
                    1. 서비스 내 제공되는 모든 자료와 정보(공공기관 API 제외)에 대한 저작권은 회사 또는 제공자에게 귀속됩니다.
                  </p>
                  <p className="text-gray-700">
                    2. 회원이 직접 등록한 화장실 정보, 리뷰 등은 서비스 운영 및 홍보를 위해 활용될 수 있습니다.
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  제9조 (서비스의 책임 제한)
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-gray-700">
                    1. 회사는 공공기관 API 또는 회원이 등록한 화장실 정보의 정확성, 신뢰성에 대해 보증하지 않습니다.
                  </p>
                  <p className="text-gray-700">
                    2. 회원이 해당 정보를 이용하여 발생한 손해에 대해서는 회사가 책임을 지지 않습니다.
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  제10조 (회원 탈퇴 및 이용 제한)
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-gray-700">
                    1. 회원은 언제든지 탈퇴를 요청할 수 있으며, 회사는 즉시 회원탈퇴를 처리합니다.
                  </p>
                  <p className="text-gray-700">
                    2. 회원이 본 약관을 위반한 경우, 회사는 서비스 이용을 제한하거나 계정을 삭제할 수 있습니다.
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  제11조 (개인정보 보호)
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-gray-700">
                    1. 회사는 서비스 제공을 위해 최소한의 개인정보(이메일)를 수집하며, 관련 법령에 따라 안전하게 관리합니다.
                  </p>
                  <p className="text-gray-700">
                    2. 개인정보의 수집·이용·보관·파기에 관한 사항은 별도의 개인정보처리방침에 따릅니다.
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  제12조 (준거법 및 분쟁 해결)
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-gray-700">
                    1. 본 약관은 대한민국 법률에 따라 해석·적용됩니다.
                  </p>
                  <p className="text-gray-700">
                    2. 서비스 이용과 관련하여 발생한 분쟁에 대하여 회사와 회원은 성실히 협의하여 해결하며, 협의가 이루어지지 않을 경우 민사소송법에 따른 관할 법원에 소송을 제기할 수 있습니다.
                  </p>
                </div>
              </section>

              <div className="text-center pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  본 약관은 2024년 1월 1일부터 시행됩니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 동의 버튼 */}
        <div className="mt-6 text-center">
          <Link to="/register">
            <Button className="px-8">
              확인했습니다
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
