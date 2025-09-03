"use client";

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
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
            <CardTitle className="text-2xl">Peeple 개인정보 처리방침</CardTitle>
            <p className="text-sm text-gray-600">
              위치 기반 화장실 안내 서비스 개인정보 처리방침
            </p>
          </CardHeader>
          
          <CardContent className="prose max-w-none">
            <div className="space-y-6 text-sm leading-relaxed">
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-700 text-sm">
                  Peeple(이하 "회사")는 「개인정보 보호법」 등 관련 법령을 준수하며, 회원의 개인정보를 안전하게 보호하기 위해 다음과 같이 개인정보 처리방침을 수립·운영합니다.
                </p>
              </div>

              <section>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  제1조 (수집하는 개인정보 항목)
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-gray-700">
                    회사는 회원가입 및 서비스 제공을 위해 다음의 개인정보를 수집합니다.
                  </p>
                  <p className="text-gray-700">
                    1. 필수 항목: 이메일 주소
                  </p>
                  <p className="text-gray-700">
                    2. 자동 수집 항목: 서비스 이용 과정에서 생성되는 정보(접속 IP, 접속 로그, 위치정보 등)
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  제2조 (개인정보의 수집 및 이용 목적)
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-gray-700">
                    회사는 수집한 개인정보를 다음의 목적을 위해 이용합니다.
                  </p>
                  <p className="text-gray-700">
                    1. 서비스 제공: 위치 기반 화장실 안내, 화장실 정보 등록 및 리뷰 기능 제공
                  </p>
                  <p className="text-gray-700">
                    2. 회원 관리: 본인 확인, 회원제 서비스 이용, 부정 이용 방지, 서비스 이용 기록 관리
                  </p>
                  <p className="text-gray-700">
                    3. 서비스 개선: 서비스 품질 향상, 통계 분석, 신규 기능 개발
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  제3조 (개인정보의 보유 및 이용 기간)
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-gray-700">
                    1. 회원의 개인정보는 회원 탈퇴 시까지 보관·이용됩니다.
                  </p>
                  <p className="text-gray-700">
                    2. 다만, 관련 법령에 따라 일정 기간 보관이 필요한 경우에는 해당 법령에서 정한 기간 동안 보관합니다.
                  </p>
                  <p className="text-gray-700 ml-4">
                    - 전자상거래 등에서의 소비자 보호에 관한 법률: 계약·청약철회 등에 관한 기록 5년, 소비자 불만·분쟁 처리 기록 3년
                  </p>
                  <p className="text-gray-700 ml-4">
                    - 통신비밀보호법: 로그인 기록 3개월
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  제4조 (개인정보의 제3자 제공)
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-gray-700">
                    1. 회사는 회원의 개인정보를 원칙적으로 외부에 제공하지 않습니다.
                  </p>
                  <p className="text-gray-700">
                    2. 다만, 법령에 따라 요청이 있는 경우 예외적으로 제공할 수 있습니다.
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  제5조 (개인정보 처리의 위탁)
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-gray-700">
                    회사는 원칙적으로 회원의 개인정보를 외부에 위탁하지 않습니다.
                  </p>
                  <p className="text-gray-700">
                    ※ 향후 서비스 운영상 위탁이 필요한 경우, 위탁 대상자와 업무 내용을 회원에게 고지하고 동의를 받습니다.
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  제6조 (위치정보의 처리)
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-gray-700">
                    1. 회사는 회원의 동의 하에 위치 정보를 수집하여 근처 화장실 안내 서비스에 활용합니다.
                  </p>
                  <p className="text-gray-700">
                    2. 위치 정보는 서비스 제공 목적 외로 사용되지 않으며, 일정 기간이 지나면 즉시 파기됩니다.
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  제7조 (개인정보의 파기 절차 및 방법)
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-gray-700">
                    1. 회사는 개인정보의 보유 기간이 경과하거나 처리 목적이 달성된 경우 지체 없이 파기합니다.
                  </p>
                  <p className="text-gray-700">
                    2. 전자적 파일 형태의 정보는 복구 불가능한 기술적 방법으로 삭제하며, 종이 문서는 분쇄하거나 소각하여 파기합니다.
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  제8조 (회원의 권리와 행사 방법)
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-gray-700">
                    1. 회원은 언제든지 자신의 개인정보를 열람·정정·삭제·처리정지 요구할 수 있습니다.
                  </p>
                  <p className="text-gray-700">
                    2. 회원은 개인정보 보호책임자에게 서면, 이메일 등을 통해 권리 행사를 요청할 수 있습니다.
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  제9조 (개인정보의 안전성 확보 조치)
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 mb-2">
                    회사는 개인정보 보호를 위해 다음과 같은 조치를 취합니다.
                  </p>
                  <div className="space-y-1 ml-4">
                    <p className="text-gray-700">- 개인정보 접근 권한 최소화</p>
                    <p className="text-gray-700">- 암호화 기술 적용(비밀번호, 위치 정보 등)</p>
                    <p className="text-gray-700">- 해킹·바이러스 대비 보안 프로그램 설치 및 점검</p>
                    <p className="text-gray-700">- 개인정보 처리 직원에 대한 정기적 보안 교육</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  제10조 (개인정보 보호책임자)
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-gray-700">
                    회사는 회원의 개인정보를 보호하고 관련 불만을 처리하기 위하여 개인정보 보호책임자를 지정하고 있습니다.
                  </p>
                  <p className="text-gray-700">
                    - 개인정보 보호책임자: [담당자 성명/직위 기재]
                  </p>
                  <p className="text-gray-700">
                    - 이메일: [연락처 이메일 기재]
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  제11조 (개인정보 처리방침의 변경)
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">
                    본 개인정보 처리방침은 관련 법령의 제·개정, 회사 정책의 변경에 따라 개정될 수 있으며, 개정 시 서비스 내 공지를 통해 고지합니다.
                  </p>
                </div>
              </section>

              <div className="text-center pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  본 방침은 2024년 1월 1일부터 시행됩니다.
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
