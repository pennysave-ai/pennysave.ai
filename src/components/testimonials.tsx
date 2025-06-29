"use client";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import Slider from "react-slick";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Avatar } from "@heroui/avatar";

function TestimonialsSection() {
  const sliderSettings = {
    dots: false,
    arrows: false,
    infinite: true,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    speed: 12000,
    autoplaySpeed: 0,
    cssEase: "linear",
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 3,
          speed: 14000,
          autoplay: true,
        },
      },
      {
        breakpoint: 980,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2,
          speed: 16000,
          autoplay: true,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          speed: 18000,
          autoplay: true,
        },
      },
    ],
  };
  return (
    <section
      className="flex flex-col items-center gap-8 mt-28"
      id="testimonials"
    >
      <h2 className="text-4xl font-bold text-center">
        What{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
          Our Users
        </span>{" "}
        Say.
      </h2>
      <div className="slider-container slider-fade-edges relative overflow-hidden">
        <span className="pointer-events-none absolute left-0 top-0 h-full w-12 bg-gradient-to-r from-white dark:from-[#060612] to-transparent z-10" />
        <span className="pointer-events-none absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-white dark:from-[#060612] to-transparent z-10" />
        <Slider {...sliderSettings} className="gap-x-4">
          <div className="p-3">
            <Card className="shadow-lg p-4 bordered">
              <CardHeader className="flex items-center gap-4">
                <Avatar
                  src="/images/0ad3ebf3-7079-4663-9a74-1d231de99990.webp"
                  name="David G."
                />
                <div>
                  <p className="font-semibold">David G.</p>
                </div>
              </CardHeader>
              <CardBody className="relative overflow-hidden">
                <blockquote className="text-default-600 italic quote">
                  Pennysave.ai has transformed the way I manage my finances.
                  After a first month of using it, It was clear where is my
                  spending going and where is a plenty of room for improvement
                </blockquote>
              </CardBody>
            </Card>
          </div>
          <div className="p-3">
            <Card className="shadow-lg p-4">
              <CardHeader className="flex items-center gap-4">
                <Avatar
                  src="/images/a0b0a959-59a4-4e75-ae6e-aec177531933.webp"
                  name="Rowan Y."
                />
                <div>
                  <p className="font-semibold">Rowan Y.</p>
                </div>
              </CardHeader>
              <CardBody className="relative overflow-hidden">
                <blockquote className="text-default-600 italic quote">
                  Pennysave.ai made budgeting so much simpler for me. The
                  intuitive interface helped me quickly spot spending patterns,
                  and now I feel much more in control of my financial goals
                </blockquote>
              </CardBody>
            </Card>
          </div>
          <div className="p-3">
            <Card className="shadow-lg p-4">
              <CardHeader className="flex items-center gap-4">
                <Avatar
                  src="/images/da54c4a6-8b71-49d4-b20e-15f31894a057.webp"
                  name="Charlotte M."
                />
                <div>
                  <p className="font-semibold">Charlotte M.</p>
                </div>
              </CardHeader>
              <CardBody className="relative overflow-hidden">
                <blockquote className="text-default-600 italic quote">
                  The budget notifications keep me motivated to stick to my
                  budget. It’s like having a supportive financial coach right in
                  my pocket.
                </blockquote>
              </CardBody>
            </Card>
          </div>
          <div className="p-3">
            <Card className="shadow-lg p-4">
              <CardHeader className="flex items-center gap-4">
                <Avatar
                  src="/images/028570b0-91f4-4104-99ab-d67474f72f75.webp"
                  name="Mateo R."
                />
                <div>
                  <p className="font-semibold">Mateo R.</p>
                </div>
              </CardHeader>
              <CardBody className="relative overflow-hidden">
                <blockquote className="text-default-600 italic quote">
                  Thanks to this platform, I feel more consistent and
                  disciplined with my finances. It feels like a fun game that
                  helps me manage my finances better
                </blockquote>
              </CardBody>
            </Card>
          </div>
          <div className="p-3">
            <Card className="shadow-lg p-4">
              <CardHeader className="flex items-center gap-4">
                <Avatar
                  src="/images/6a9201d0-53ff-433a-b290-60f1998ecac3.webp"
                  name="Henry C."
                />
                <div>
                  <p className="font-semibold">Henry C.</p>
                </div>
              </CardHeader>
              <CardBody className="relative overflow-hidden">
                <blockquote className="text-default-600 italic quote">
                  With Pennysave.ai, I finally feel empowered to make informed
                  decisions about my money. The visual breakdowns are clear and
                  actionable, making it easy to plan for the future
                </blockquote>
              </CardBody>
            </Card>
          </div>
          <div className="p-3">
            <Card className="shadow-lg p-4">
              <CardHeader className="flex items-center gap-4">
                <Avatar
                  src="/images/f60e75e2-d776-4b49-ab21-8a13fe9a1a5d.webp"
                  name="Aurora L."
                />
                <div>
                  <p className="font-semibold">Aurora L.</p>
                </div>
              </CardHeader>
              <CardBody className="relative overflow-hidden">
                <blockquote className="text-default-600 italic quote">
                  I never realized how much little purchases added up until I
                  started using Pennysave.ai. Now, I’m making smarter choices
                  and actually enjoying the process of improving my finances
                </blockquote>
              </CardBody>
            </Card>
          </div>
        </Slider>
      </div>
    </section>
  );
}

export default TestimonialsSection;
