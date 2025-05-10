import React from 'react';
import Layout from '../components/Layout';

const About = () => (
  <Layout>
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md pt-14 p-6 mt-6 mb-12">
      <h1 className="text-3xl font-bold mb-2 text-blue-700">About Me</h1>
      <p className="mb-4 text-gray-700">
        Hi, I’m Craig Sharpe, a Lead Engineer based in South Yorkshire with over 25 years of experience in IT, primarily within the financial services sector. My passion is building robust, scalable systems—especially using Golang and cloud-native technologies.
      </p>
      <p className="mb-4 text-gray-700">
        I specialise in designing and deploying distributed microservices, automating infrastructure, and driving DevOps best practices. I thrive on solving complex problems, whether that’s architecting event-driven platforms, modernising legacy systems, or ensuring reliability at scale.
      </p>
      <p className="mb-4 text-gray-700">
        As a technical leader, I enjoy mentoring engineers, fostering collaboration, and creating a culture of innovation and continuous improvement. I believe in clear communication and making technology accessible to everyone—technical or not.
      </p>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-1">My Artificial Pancreas Journey</h2>
        <p className="mb-2 text-gray-700">
          Over a decade ago, I set out to design and build my own artificial pancreas system. Using a Freestyle Libre sensor and an Accu-Chek Spirit Combo insulin pump, I engineered a homemade device that could read my blood sugar levels via RFID and send the data to my phone.
        </p>
        <p className="mb-2 text-gray-700">
          I went as far as disassembling the Accu-Chek pump, extracting and reverse-engineering the code on its chip, and decoding its Bluetooth protocol. This allowed me to remotely adjust insulin delivery in real time.
        </p>
        <p className="mb-2 text-gray-700">
          My system leveraged the OpenAPS algorithms by Dana Lewis, enabling closed-loop insulin automation long before commercial solutions were widely available. This project combined my engineering skills, curiosity, and drive to improve quality of life through technology.
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-1">What I Do</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Architect and deliver cloud-native solutions on GCP, AWS, and Azure</li>
          <li>Build and maintain Golang microservices and event-driven systems</li>
          <li>Automate infrastructure and CI/CD pipelines for speed and reliability</li>
          <li>Champion observability, SLOs, and reliability engineering</li>
          <li>Lead and mentor engineering teams, driving best practices</li>
        </ul>
      </div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-1">Tech I Love</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Golang, Python, React, Next.js</li>
          <li>Kubernetes, Terraform, Docker</li>
          <li>Kafka, Pub/Sub, Dynatrace</li>
        </ul>
      </div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-1">Certifications</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Google Associate Cloud Engineer</li>
          <li>Terraform Associate</li>
          <li>CKAD & CKA Kubernetes</li>
        </ul>
      </div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-1">Beyond Work</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Electronics & robotics tinkerer</li>
          <li>Home automation & IoT enthusiast</li>
          <li>Chess player</li>
        </ul>
      </div>
      <div className="flex flex-wrap gap-4 text-sm mt-4">
        <a href="mailto:sharpyuk@gmail.com" className="text-blue-600 underline">Email</a>
        <a href="https://linkedin.com/in/craig-sharpe-uk" target="_blank" rel="noopener" className="text-blue-600 underline">LinkedIn</a>
        <a href="https://credly.com/users/craig-sharpe.91b0fade" target="_blank" rel="noopener" className="text-blue-600 underline">Credly Badges</a>
      </div>
    </div>
  </Layout>
);

export default About;