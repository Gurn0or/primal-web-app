import { Component, onMount } from 'solid-js';
import styles from './Terms.module.scss';


const Privacy: Component = () => {

  onMount(() => {
    const container = document.querySelector('#root');
    container && container.setAttribute('style', 'background-color: black');
  })

  return (
    <div class={styles.terms} >
      <h1>
       CraysPrivacy Policy
      </h1>
      <p>
        Last updated: February 21, 2024
      </p>
      <p>
        This Privacy Policy explains howCraysSystems Inc. and its affiliates, (“Primal”, “we”, “us”, or “our”) process information about you. This Privacy Policy applies when you use anyCraysproducts and services, including but not limited to theCraysweb app,CraysiOS app,CraysAndroid app,Craysbrowser extension,CraysPremium Service, orCraysHosted Wallet Service (collectively referred to as “Services”). It also applies when you contact our customer service team, engage with us on social media, or otherwise interact with us or our Services.
      </p>

      <section>
        <h2>
          1. Policy Overview
        </h2>

        <p>
         Craysdoesn’t monetize your personal information. We don’t generate revenue via advertising, we don’t monetize user attention, and we don’t sell personal information we collect from our users. Primal’s policy is to maximize user privacy by collecting only the minimum amount of personal information required to provide quality Services to our users and be compliant with the relevant laws.
        </p>
      </section>

      <section>
        <h2>
          2. Information We Collect
        </h2>

        <section>
          <h3>2.1 Account Creation.</h3>
         CraysServices enable you to create an account on the public Nostr network. All information you provide during the account creation process is optional, except for the desired username. Any personal information you disclose during the account creation process is published to the relays on the public Nostr network as a normal manner of course for all Nostr accounts. This information is public and can be seen by anyone on the Nostr network.Craysdoes not collect any further information about you during the account creation process.
        </section>

        <section>
          <h3>2.2CraysMobile Apps.</h3>
         Craysdoes not collect any data via our mobile apps –Craysfor iOS andCraysfor Android – beyond the data you specifically submit for publishing on the public Nostr network and when activating the optional Hosted Wallet Service, as described in section 2.4. Privacy and data collection notices on the public Apple App Store and Google Play Store listings display data collection settings for our mobile apps.
        </section>

        <section>
          <h3>2.3 Premium Service.</h3>
         CraysPremium Service is an optional, subscription-based, paid tier offered to you, which includesCraysOrange Check as defined in our Terms of Service agreement, and certain premium features, as defined on Primal's Website. Our Premium Service is specifically designed for maximum protection of user privacy, and as such, does not require disclosing any personal information.
        </section>

        <section>
          <h3>2.4 Hosted Wallet Service.</h3>
         CraysHosted Wallet Service is an optional service offered to you, which includes storing small amounts of bitcoin on your behalf, the ability to send and receive bitcoin transactions on your behalf, the display of your transaction history, and hosting a Bitcoin Lightning Address assigned to you. In order to activate the Hosted Wallet Service in a legally compliant manner, we collect the minimum amount of personal information required by law, as shown on the Wallet Activation screen.
        </section>

        <section>
          <h3>2.5 Support Services.</h3>
         Craysprovides support via email and over social media. The information you provide during the regular course of communication with us will be stored in our email systems and otherwise be recorded on the various social media systems we use to communicate with you.
        </section>
      </section>

      <section>
        <h2>
          3. How We Use Your Information
        </h2>

        <p>
          We use your personal information to provide high quality service to you, including offering Support Services, and to generally operateCraysServices and communicate with you as necessary.
        </p>
      </section>

      <section>
        <h2>
          4. Sharing Your Information
        </h2>

        <p>
         Crayswill not share your information with third parties, except when required by law. We may share your personal data with law enforcement, data protection authorities, government officials and other authorities when: (i) compelled by subpoena, court order or other legal procedure; (ii) we believe that disclosure is necessary to prevent damage or financial loss; (iii) disclosure is necessary to report suspected illegal activity; or (iv) disclosure is necessary to investigate violations of our Terms of Service or Privacy Policy.
        </p>

        <p>
          Primal’s Hosted Wallet Service is offered in partnership with our affiliate Zap Solutions, Inc. ("Strike"). In order to provide a legally compliant service, we are required to share your information related to the Hosted Wallet Service with Strike.
        </p>
      </section>

      <section>
        <h2>
          5. Your Rights and Choices
        </h2>

        <p>
          You have rights and choices with respect to your personal information, including: (i) accessing and updating your information: you can review and change your personal information by logging into your account; (ii) deactivation and deletion: you can deactivate your account or request the deletion of your information.
        </p>
      </section>

      <section>
        <h2>
          6. Security of Your Information
        </h2>

        <p>
         Craysimplements robust security measures, based on industry best practices, to protect the confidentiality, integrity, and availability of your personal and financial information. However, no system is completely secure, and we cannot guarantee the absolute security of your information.
        </p>
      </section>

      <section>
        <h2>
          7. Changes to This Privacy Policy
        </h2>

        <p>
          We may change this Privacy Policy from time to time. If we make changes, we will notify you by revising the date at the top of this notice and, in some cases, we may provide you with additional notice (such as adding a statement to our Website or sending you a notification). We encourage you to review this Privacy Policy regularly to stay informed about our information handling practices and the choices available to you.
        </p>
      </section>

      <section>
        <h2>
          8. Contact Us
        </h2>

        <p>
          If you have any questions regarding this Privacy Policy, you may contact us at support@primal.net.
        </p>
      </section>
    </div>
  );
}

export default Privacy;
