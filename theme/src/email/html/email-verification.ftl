<#import "template.ftl" as layout>
<@layout.emailLayout title=msg("emailVerificationSubject") button=msg("arcButton.VERIFY_EMAIL") link=link>
${kcSanitize(msg("arcLinkWorks", linkExpirationFormatter(linkExpiration)))?no_esc}
</@layout.emailLayout>
