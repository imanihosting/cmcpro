import React from 'react';

export const metadata = {
  title: 'Cookie Policy | Childminder Connect',
  description: 'Learn about how Childminder Connect uses cookies on our website.',
};

const CookiePolicyPage = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Cookie Policy</h1>
      
      <div className="prose max-w-none">
        <p className="mb-4">Last updated: April 8, 2025</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Introduction</h2>
        <p>
          Childminder Connect ("we" or "us" or "our") uses cookies on our website. By using the service, you consent to the use of cookies.
        </p>
        <p>
          Our Cookie Policy explains what cookies are, how we use them, how third parties we may partner with may use cookies on the service, your choices regarding cookies, and further information about cookies.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">What Are Cookies</h2>
        <p>
          Cookies are small pieces of text sent by your web browser by a website you visit. A cookie file is stored in your web browser and allows the service or a third party to recognize you and make your next visit easier and the service more useful to you.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">How Childminder Connect Uses Cookies</h2>
        <p>
          When you use and access our service, we may place several cookies in your web browser. We use cookies for the following purposes:
        </p>
        <ul className="list-disc ml-6 my-4">
          <li><strong>Essential cookies:</strong> Required for the operation of our website. They include, for example, cookies that enable you to log into secure areas of our website.</li>
          <li><strong>Analytical/performance cookies:</strong> Allow us to recognize and count the number of visitors and to see how visitors move around our website when they are using it.</li>
          <li><strong>Functionality cookies:</strong> Used to recognize you when you return to our website. This enables us to personalize our content for you and remember your preferences.</li>
          <li><strong>Targeting cookies:</strong> Record your visit to our website, the pages you have visited, and the links you have followed.</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Third-Party Cookies</h2>
        <p>
          In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the service, deliver advertisements on and through the service, and so on.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Types of Cookies We Use</h2>
        <div className="overflow-x-auto my-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-3 text-left">Cookie Type</th>
                <th className="border p-3 text-left">Purpose</th>
                <th className="border p-3 text-left">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-3">Session Cookies</td>
                <td className="border p-3">Used to maintain your session while using our platform</td>
                <td className="border p-3">Session</td>
              </tr>
              <tr>
                <td className="border p-3">Authentication Cookies</td>
                <td className="border p-3">Used to remember your login status</td>
                <td className="border p-3">30 days</td>
              </tr>
              <tr>
                <td className="border p-3">Preference Cookies</td>
                <td className="border p-3">Used to remember your preferences, such as language</td>
                <td className="border p-3">1 year</td>
              </tr>
              <tr>
                <td className="border p-3">Analytics Cookies</td>
                <td className="border p-3">Used to collect information about how you use our website</td>
                <td className="border p-3">2 years</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Your Choices Regarding Cookies</h2>
        <p>
          If you prefer to avoid the use of cookies on the website, first you must disable the use of cookies in your browser and then delete the cookies saved in your browser associated with this website.
        </p>
        <p>
          You can use the options in your web browser if you do not wish to receive a cookie or if you wish to set your browser to notify you when you receive a cookie. You can easily delete and manage any cookies that have been installed in the cookie folder of your browser by following the instructions provided by your browser manufacturer.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Consent</h2>
        <p>
          By using our website, you consent to our cookie policy. You can change your cookie settings at any time by using the Cookie Settings option in the footer of our website.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Changes to Our Cookie Policy</h2>
        <p>
          We may update our Cookie Policy from time to time. We will notify you of any changes by posting the new Cookie Policy on this page and updating the "Last updated" date at the top of this page.
        </p>
        <p>
          You are advised to review this Cookie Policy periodically for any changes. Changes to this Cookie Policy are effective when they are posted on this page.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Contact Us</h2>
        <p>
          If you have any questions about our Cookie Policy, please contact us at:
        </p>
        <p className="mb-8">
          <a href="mailto:support@childminderconnect.ie" className="text-blue-600 hover:underline">support@childminderconnect.ie</a>
        </p>
      </div>
    </div>
  );
};

export default CookiePolicyPage;